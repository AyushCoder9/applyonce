import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const files = execFileSync("rg", ["--files", "apps/web/src", "apps/demo-exam-portal/src", "-g", "*.tsx"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const failures = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const tag = (node) => node.tagName?.getText(tree);
  const attribute = (node, name) => node.attributes?.properties?.find((property) => ts.isJsxAttribute(property) && property.name.getText(tree) === name);
  const location = (node) => `${file}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1}`;
  const insideNativeForm = (node) => {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (ts.isJsxElement(parent) && tag(parent.openingElement) === "form") return true;
    }
    return false;
  };

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = tag(node);
      if (name === "button" || name === "Button") {
        const behavior = attribute(node, "onClick") || attribute(node, "onPress") || attribute(node, "type") || attribute(node, "formAction") || attribute(node, "href") || (name === "button" && insideNativeForm(node));
        if (!behavior) failures.push(`${location(node)} handlerless ${name}`);
      }
      if (name === "a" || name === "Link") {
        const href = attribute(node, "href");
        if (!href) failures.push(`${location(node)} ${name} is missing href`);
        else if (/['\"](?:#|)['\"]/.test(href.getText(tree))) failures.push(`${location(node)} ${name} uses a placeholder href`);
      }
    }
    if (ts.isJsxAttribute(node) && /^on[A-Z]/.test(node.name.getText(tree)) && node.initializer && ts.isJsxExpression(node.initializer)) {
      const expression = node.initializer.expression;
      if (expression && (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) && ts.isBlock(expression.body) && expression.body.statements.length === 0) {
        failures.push(`${location(node)} empty ${node.name.getText(tree)} handler`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Interaction source audit passed across ${files.length} TSX files: no placeholder links, handlerless buttons, or empty event handlers.`);
