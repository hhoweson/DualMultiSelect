import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import autoprefixer from "autoprefixer";
import packageJson from './package.json';

export default defineConfig(({ command, mode }) => {

    if(mode === 'demoBuild'){

        return {
            root: "demo",
            base: "/DualMultiSelect/", // GitHub Pages subdirectory (repo name)
            build: {
                outDir: "./../docs", // GitHub Pages folder
                emptyOutDir: true,
            },
            css: {
                postcss: {
                    plugins: [autoprefixer()],
                },
            },
            define: {
                "__DUALMULTISELECT_VERSION__": JSON.stringify(packageJson.version),
            },
        };

    }

    return {
        // Use the demo folder as root for the development server
        root: (command === "serve") ? "demo" : ".",
        build: {
            lib: {
                entry: "src/index.ts",
                name: "DualMultiSelect",
                formats: ["es", "cjs", "umd"], // Export as ES modules, CommonJS, and UMD
                fileName: (format) => {
                    return `js/DualMultiSelect.${format}.min.js`;
                },
                cssFileName: 'css/DualMultiSelect.min',
            },
            target: "es2015", // Ensure compatibility with ES6 browsers
            sourcemap: true,
        },
        plugins: [dts({ // Generates TypeScript declaration files (.d.ts)
            insertTypesEntry: true,
            rollupTypes: true, // Only generate .d.ts files for the main entry file
            outDir: "dist/js",
        })],
        css: {
            devSourcemap: true, // Generate source maps in dev mode
            postcss: {
                plugins: [
                    autoprefixer() // Automatically add vendor prefixes
                ]
            }
        },
        define: {
            '__DUALMULTISELECT_VERSION__': JSON.stringify(packageJson.version) // Make the version number available in the code
        }
    };

});