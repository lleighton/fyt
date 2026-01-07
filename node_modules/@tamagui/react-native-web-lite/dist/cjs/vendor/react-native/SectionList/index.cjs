var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf,
  __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
    value: mod,
    enumerable: !0
  }) : target, mod)),
  __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
    value: !0
  }), mod);
var SectionList_exports = {};
__export(SectionList_exports, {
  SectionList: () => SectionList,
  default: () => SectionList_default
});
module.exports = __toCommonJS(SectionList_exports);
var import_VirtualizedSectionList = require("../VirtualizedSectionList/index.cjs"),
  React = __toESM(require("react"), 1),
  import_jsx_runtime = require("react/jsx-runtime");
class SectionList extends React.PureComponent {
  scrollToLocation(params) {
    this._wrapperListRef != null && this._wrapperListRef.scrollToLocation(params);
  }
  recordInteraction() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.recordInteraction();
  }
  flashScrollIndicators() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.flashScrollIndicators();
  }
  getScrollResponder() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    if (listRef) return listRef.getScrollResponder();
  }
  getScrollableNode() {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    if (listRef) return listRef.getScrollableNode();
  }
  setNativeProps(props) {
    const listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
    listRef && listRef.setNativeProps(props);
  }
  render() {
    const {
      sections,
      ...passThroughProps
    } = this.props;
    return /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_VirtualizedSectionList.VirtualizedSectionList, {
      ...passThroughProps,
      sections,
      ref: this._captureRef,
      getItem: this._getItem,
      getItemCount: this._getItemCount,
      keyExtractor: this._keyExtractor,
      renderItem: this._renderItem
    });
  }
  _captureRef = ref => {
    this._wrapperListRef = ref;
  };
  _getItem = (sections, index) => {
    if (!sections) return null;
    const section = sections[index];
    return section && section.data ? section.data[0] : null;
  };
  _getItemCount = sections => sections ? sections.length : 0;
  _keyExtractor = (item, index) => (this.props.keyExtractor || this._defaultKeyExtractor)(item, index);
  _defaultKeyExtractor = (item, index) => item.key != null ? item.key : String(index);
  _renderItem = ({
    item,
    index,
    section
  }) => (this.props.renderItem || this._defaultRenderItem)({
    item,
    index,
    section
  });
  _defaultRenderItem = ({
    item
  }) => null;
}
var SectionList_default = SectionList;