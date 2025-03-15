// Defined in vite.config.ts
declare const __DUALMULTISELECT_VERSION__: string;

// Dual Multi Select
import "../src/styles/DualMultiSelect.scss";
import DualMultiSelect from "../src/index.ts";

// Code highlighting
import hljs from "highlight.js/lib/core";
import javascript from 'highlight.js/lib/languages/javascript'; // Javascript language
import html from 'highlight.js/lib/languages/xml'; // HTML language
import "highlight.js/styles/github.css"; // Github theme

// Register code-highlighting languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', html);

// Fill in version numbers
document.querySelectorAll(".versionNumber").forEach(element => {
    element.textContent = __DUALMULTISELECT_VERSION__;
});
document.getElementById("cdnScriptTag")!.textContent = `<script src="https://cdn.jsdelivr.net/npm/dualmultiselect@${__DUALMULTISELECT_VERSION__}/dist/js/DualMultiSelect.umd.min.js"></script>`;
document.getElementById("cdnCssTag")!.textContent = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/dualmultiselect@${__DUALMULTISELECT_VERSION__}/dist/css/DualMultiSelect.min.css">`;


class Examples {

    constructor()
    {
        const exampleTemplates = document.querySelectorAll("template.exampleCodeTemplate") as NodeListOf<HTMLTemplateElement>;

        // Create examples from all templates
        for(const exampleTemplate of exampleTemplates){
            this.createExample(exampleTemplate);
        }

        // Apply syntax highlighting to all code block elements
        document.querySelectorAll(".codeBlock").forEach(codeElement => {
            hljs.highlightElement(codeElement as HTMLElement);
        });
    }

    /**
     * Template content should contain a script tag (the example JS) and an element (the example HTML)
     * The code will be extracted from the template and be both shown as an example and used to create the example
     */
    private createExample(template: HTMLTemplateElement)
    {
        // Fetch the template content
        const templateContent = template.content;

        // Extract the example HTML and JS
        const exampleHtml = templateContent.querySelector(":not(script)")?.outerHTML;
        const exampleJs = templateContent.querySelector("script")?.textContent;

        if(!exampleHtml || !exampleJs) return;

        // Create the elements for the example itself and the related code
        const exampleContainer = document.createElement("div");
        exampleContainer.classList.add("exampleContainer");

        const exampleCodeElement = this.createExampleCodeElement(exampleHtml, exampleJs);
        const exampleElement = this.createExampleElement(exampleHtml);
        exampleContainer.appendChild(exampleCodeElement);
        exampleContainer.appendChild(exampleElement);

        // Replace the template with the example
        template.replaceWith(exampleContainer);

        // Run the code so that the example works
        this.runExampleJs(exampleJs);
    }

    private createExampleCodeElement(exampleHtml: string, exampleJs: string): HTMLElement
    {
        const exampleCodeElement = document.createElement("div");
        exampleCodeElement.classList.add("exampleCode");

        for(const code of [exampleHtml, exampleJs]){
            const codeElement = this.createCodeElement(code);
            exampleCodeElement.appendChild(codeElement);
        }

        return exampleCodeElement;
    }

    private createCodeElement(code: string): HTMLElement
    {
        code = this.formatCode(code);

        const preElement = document.createElement("pre");
        const codeElement = document.createElement("code");

        preElement.appendChild(codeElement);
        codeElement.textContent = code;

        // Apply syntax highlighting
        hljs.highlightElement(codeElement);

        return preElement;
    }

    private formatCode(code: string): string
    {
        let lines = code.split("\n");

        // Remove empty lines
        lines = lines.filter(line => line.trim() !== "");

        // Use the indentation of the last line as the base indentation
        // This is more reliable than the first line because the first line of "outerHTML" won't be indented
        const lastLine = lines[lines.length - 1];
        const lastLineIndentation = lastLine.match(/^\s*/)?.[0] || "";

        // Remove the indentation of the last line from all lines
        for(let i = 0; i < lines.length; i++){
            lines[i] = lines[i].replace(lastLineIndentation, "");
        }

        return lines.join("\n");
    }

    private createExampleElement(exampleHtml: string): HTMLElement
    {
        const exampleElement = document.createElement("div");
        exampleElement.classList.add("example");
        exampleElement.innerHTML = exampleHtml;
        return exampleElement;
    }

    private runExampleJs(exampleJs: string)
    {
        // Logging the DualMultiSelect class to console has 2 effects:
        // 1. It bring it into the scope of the eval function, allowing the example code to use it
        // 2. It prevents tree-shaking from removing the class from the bundle
        // This isn't ideal and a better solution should be sought
        console.log(DualMultiSelect);
        eval(exampleJs);
    }

}

document.addEventListener("DOMContentLoaded", function () {
    new Examples();
});