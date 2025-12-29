var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, {
      get: all[name],
      enumerable: !0
    });
  },
  __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function") for (let key of __getOwnPropNames(from)) !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
    return to;
  };
var __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
  value: !0
}), mod);
var propsToAccessibilityComponent_exports = {};
__export(propsToAccessibilityComponent_exports, {
  propsToAccessibilityComponent: () => propsToAccessibilityComponent
});
module.exports = __toCommonJS(propsToAccessibilityComponent_exports);
var import_propsToAriaRole = require("./propsToAriaRole.cjs");
const roleComponents = {
    article: "article",
    banner: "header",
    blockquote: "blockquote",
    code: "code",
    complementary: "aside",
    contentinfo: "footer",
    deletion: "del",
    emphasis: "em",
    figure: "figure",
    insertion: "ins",
    form: "form",
    list: "ul",
    listitem: "li",
    main: "main",
    navigation: "nav",
    region: "section",
    strong: "strong"
  },
  emptyObject = {},
  propsToAccessibilityComponent = (props = emptyObject) => {
    if (props.accessibilityRole === "label") return "label";
    const role = (0, import_propsToAriaRole.propsToAriaRole)(props);
    if (role) {
      if (role === "heading") {
        const level = props.accessibilityLevel || props["aria-level"];
        return level != null ? `h${level}` : "h1";
      }
      return roleComponents[role];
    }
  };