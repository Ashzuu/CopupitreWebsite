const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
    tsConfigFilePath: "tsconfig.app.json",
});

project.addSourceFilesAtPaths("src/app/**/*.ts");

const sourceFiles = project.getSourceFiles("src/app/**/*.ts");

let changedCount = 0;

for (const sourceFile of sourceFiles) {
    if (sourceFile.getFilePath().endsWith('.spec.ts')) continue;
    let changed = false;

    // 1. Organize imports & fix unused identifiers
    try {
        sourceFile.fixUnusedIdentifiers();
        sourceFile.organizeImports();
        changed = true;
    } catch (e) {
        console.error('Error organizing imports');
    }

    // 2. Add JSDoc to public methods and properties
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
        // Properties
        for (const prop of cls.getProperties()) {
            if (prop.hasModifier(SyntaxKind.PrivateKeyword) || prop.hasModifier(SyntaxKind.ProtectedKeyword)) continue;
            if (prop.getJsDocs().length === 0) {
                prop.addJsDoc({
                    description: `The ${prop.getName()} property.`
                });
                changed = true;
            }
        }
        
        // Methods
        for (const method of cls.getMethods()) {
            if (method.hasModifier(SyntaxKind.PrivateKeyword) || method.hasModifier(SyntaxKind.ProtectedKeyword)) continue;
            // Exclude lifecycle hooks
            const name = method.getName();
            if (["ngOnInit", "ngOnChanges", "ngOnDestroy", "ngAfterViewInit"].includes(name)) continue;
            
            if (method.getJsDocs().length === 0) {
                method.addJsDoc({
                    description: `Executes the ${name} action.`
                });
                changed = true;
            }
        }
    }

    // Interface Properties
    const interfaces = sourceFile.getInterfaces();
    for (const intf of interfaces) {
        for (const prop of intf.getProperties()) {
             if (prop.getJsDocs().length === 0) {
                 prop.addJsDoc({
                     description: `The ${prop.getName()} property.`
                 });
                 changed = true;
             }
        }
    }

    if (changed) {
        sourceFile.saveSync();
        changedCount++;
    }
}
