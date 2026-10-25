#!/usr/bin/env bash
# =============================================================================
# Script de déploiement automatisé pour CopupitreWebsite (Debian / Linux)
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration & Couleurs
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

HEALTHCHECK_TIMEOUT=60
HEALTHCHECK_INTERVAL=3
SERVICE_NAME="copupitre-website"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Trap pour capturer les erreurs inattendues
trap 'log_error "Le déploiement a échoué à la ligne $LINENO. Code de retour : $?"; exit 1' ERR

# -----------------------------------------------------------------------------
# 1. Résolution du répertoire de travail
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"
log_info "Répertoire d'exécution : ${SCRIPT_DIR}"

# -----------------------------------------------------------------------------
# 2. Vérification des prérequis Docker et Docker Compose
# -----------------------------------------------------------------------------
log_info "Vérification des prérequis Docker sur le système hôte..."

if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker n'est pas installé sur cette machine."
    log_error "Sur Debian / Ubuntu : sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log_error "Le démon Docker ne répond pas ou l'utilisateur courant n'a pas les droits nécessaires."
    log_error "Vérifiez le service : sudo systemctl status docker"
    log_error "Démarrage du service : sudo systemctl start docker"
    log_error "Ajout de l'utilisateur au groupe docker : sudo usermod -aG docker \$USER"
    exit 1
fi

# Détection de la commande Compose disponible (docker compose plugin vs docker-compose binaire)
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=("docker" "compose")
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=("docker-compose")
else
    log_error "Ni 'docker compose' (plugin v2) ni 'docker-compose' (binaire autonome) ne sont disponibles."
    log_error "Sur Debian / Ubuntu : sudo apt-get update && sudo apt-get install -y docker-compose-plugin"
    exit 1
fi

log_success "Docker est opérationnel. Moteur Compose détecté : ${COMPOSE_CMD[*]}"

# -----------------------------------------------------------------------------
# 3. Validation de l'environnement et mise à jour du code (Git)
# -----------------------------------------------------------------------------
SKIP_PULL="${SKIP_GIT_PULL:-false}"
if [[ "${1:-}" == "--no-pull" ]]; then
    SKIP_PULL=true
fi

if [[ "${SKIP_PULL}" == "false" ]] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_info "Dépôt Git détecté. Récupération des dernières modifications..."
    git fetch --prune
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    log_info "Branche actuelle : ${CURRENT_BRANCH}"
    git pull --ff-only || {
        log_warn "Échec du git pull --ff-only (conflits locaux possibles). Le déploiement continue avec le code local."
    }
else
    log_info "Étape Git ignorée (option --no-pull active ou répertoire autonome)."
fi

# Validation des fichiers essentiels
if [[ ! -f "Dockerfile" ]]; then
    log_error "Fichier 'Dockerfile' introuvable dans ${SCRIPT_DIR}."
    exit 1
fi

if [[ ! -f "docker-compose.yml" ]]; then
    log_error "Fichier 'docker-compose.yml' introuvable dans ${SCRIPT_DIR}."
    exit 1
fi

if [[ ! -f "package.json" ]]; then
    log_error "Fichier 'package.json' introuvable dans ${SCRIPT_DIR}."
    exit 1
fi

# Chargement d'un fichier .env local s'il existe
if [[ -f ".env" ]]; then
    log_info "Fichier .env détecté et chargé pour le déploiement."
fi

# Détermination du port exposé pour les vérifications
TARGET_PORT="${WEBSITE_PORT:-40000}"
log_info "Port cible configuré : ${TARGET_PORT}"

# -----------------------------------------------------------------------------
# 4. Build et redémarrage propre du conteneur
# -----------------------------------------------------------------------------
log_info "Lancement du build Docker et déploiement du conteneur..."
"${COMPOSE_CMD[@]}" up -d --build --remove-orphans

# -----------------------------------------------------------------------------
# 5. Attente et validation du Healthcheck
# -----------------------------------------------------------------------------
log_info "Attente de la validation du Healthcheck (timeout : ${HEALTHCHECK_TIMEOUT}s)..."

CONTAINER_ID="$("${COMPOSE_CMD[@]}" ps -q "${SERVICE_NAME}" 2>/dev/null || true)"
if [[ -z "${CONTAINER_ID}" ]]; then
    log_error "Le conteneur '${SERVICE_NAME}' n'a pas pu être instancié."
    "${COMPOSE_CMD[@]}" logs --tail 50 "${SERVICE_NAME}"
    exit 1
fi

elapsed=0
is_healthy=false

while (( elapsed < HEALTHCHECK_TIMEOUT )); do
    # Vérification de l'état d'exécution du conteneur
    CONTAINER_RUNNING="$(docker inspect --format='{{.State.Running}}' "${CONTAINER_ID}" 2>/dev/null || echo "false")"
    if [[ "${CONTAINER_RUNNING}" != "true" ]]; then
        log_error "Le conteneur '${SERVICE_NAME}' s'est arrêté de manière inattendue."
        docker inspect --format='ExitCode: {{.State.ExitCode}}, Error: {{.State.Error}}' "${CONTAINER_ID}" || true
        log_error "Derniers logs du conteneur :"
        "${COMPOSE_CMD[@]}" logs --tail 50 "${SERVICE_NAME}"
        exit 1
    fi

    # Inspection du statut du Healthcheck Docker
    HEALTH_STATUS="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${CONTAINER_ID}" 2>/dev/null || echo "unknown")"

    if [[ "${HEALTH_STATUS}" == "healthy" ]]; then
        is_healthy=true
        break
    elif [[ "${HEALTH_STATUS}" == "unhealthy" ]]; then
        log_error "Le Healthcheck a retourné l'état 'unhealthy'."
        log_error "Derniers logs du conteneur :"
        "${COMPOSE_CMD[@]}" logs --tail 50 "${SERVICE_NAME}"
        exit 1
    fi

    # Fallback optionnel via curl local si le healthcheck docker natif n'est pas encore évalué
    if command -v curl >/dev/null 2>&1; then
        if curl -s -f "http://localhost:${TARGET_PORT}/" >/dev/null 2>&1; then
            log_info "Réponse HTTP 200 reçue avec succès sur http://localhost:${TARGET_PORT}/"
            is_healthy=true
            break
        fi
    fi

    sleep "${HEALTHCHECK_INTERVAL}"
    elapsed=$(( elapsed + HEALTHCHECK_INTERVAL ))
    echo -n "."
done
echo ""

if [[ "${is_healthy}" != "true" ]]; then
    log_error "Délai d'attente dépassé (${HEALTHCHECK_TIMEOUT}s) : le conteneur ne répond pas au Healthcheck."
    log_error "Derniers logs du conteneur :"
    "${COMPOSE_CMD[@]}" logs --tail 50 "${SERVICE_NAME}"
    exit 1
fi

log_success "Le conteneur '${SERVICE_NAME}' est en bonne santé (HEALTHY) !"

# -----------------------------------------------------------------------------
# 6. Nettoyage des images orphelines
# -----------------------------------------------------------------------------
log_info "Nettoyage des images Docker orphelines et dangling..."
docker image prune -f || log_warn "Avertissement lors du nettoyage des images orphelines."

# -----------------------------------------------------------------------------
# 7. Résumé du déploiement
# -----------------------------------------------------------------------------
echo ""
log_success "============================================================="
log_success " Déploiement de CopupitreWebsite terminé avec succès !"
log_success "============================================================="
"${COMPOSE_CMD[@]}" ps "${SERVICE_NAME}"
echo ""
log_info "Application accessible sur : http://localhost:${TARGET_PORT}/"
exit 0
