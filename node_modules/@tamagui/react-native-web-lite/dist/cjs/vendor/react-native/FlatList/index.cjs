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
var FlatList_exports = {};
__export(FlatList_exports, {
  FlatList: () => FlatList,
  default: () => FlatList_default
});
module.exports = __toCommonJS(FlatList_exports);
var import_View = require("../../../View/index.cjs"),
  import_deepDiffer = require("../deepDiffer/index.cjs"),
  import_Platform = require("../../../exports/Platform"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  React = __toESM(require("react"), 1),
  import_VirtualizedList = require("../VirtualizedList/index.cjs"),
  import_VirtualizeUtils = require("../VirtualizeUtils/index.cjs"),
  import_memoize_one = __toESM(require("memoize-one"), 1),
  import_jsx_runtime = require("react/jsx-runtime");
function removeClippedSubviewsOrDefault(removeClippedSubviews) {
  return removeClippedSubviews ?? import_Platform.Platform.OS === "android";
}
function numColumnsOrDefault(numColumns) {
  return numColumns ?? 1;
}
function isArrayLike(data) {
  return typeof Object(data).length == "number";
}
class FlatList extends React.PureComponent {
  /**
   * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
   */
  scrollToEnd(params) {
    this._listRef && this._listRef.scrollToEnd(params);
  }
  /**
   * Scrolls to the item at the specified index such that it is positioned in the viewable area
   * such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the
   * middle. `viewOffset` is a fixed number of pixels to offset the final target position.
   *
   * Note: cannot scroll to locations outside the render window without specifying the
   * `getItemLayout` prop.
   */
  scrollToIndex(params) {
    this._listRef && this._listRef.scrollToIndex(params);
  }
  /**
   * Requires linear scan through data - use `scrollToIndex` instead if possible.
   *
   * Note: cannot scroll to locations outside the render window without specifying the
   * `getItemLayout` prop.
   */
  scrollToItem(params) {
    this._listRef && this._listRef.scrollToItem(params);
  }
  /**
   * Scroll to a specific content pixel offset in the list.
   *
   * Check out [scrollToOffset](docs/virtualizedlist.html#scrolltooffset) of VirtualizedList
   */
  scrollToOffset(params) {
    this._listRef && this._listRef.scrollToOffset(params);
  }
  /**
   * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
   * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
   * taps on items or by navigation actions.
   */
  recordInteraction() {
    this._listRef && this._listRef.recordInteraction();
  }
  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators() {
    this._listRef && this._listRef.flashScrollIndicators();
  }
  /**
   * Provides a handle to the underlying scroll responder.
   */
  getScrollResponder() {
    if (this._listRef) return this._listRef.getScrollResponder();
  }
  /**
   * Provides a reference to the underlying host component
   */
  getNativeScrollRef() {
    if (this._listRef) return this._listRef.getScrollRef();
  }
  getScrollableNode() {
    if (this._listRef) return this._listRef.getScrollableNode();
  }
  constructor(props) {
    super(props), this._checkProps(this.props), this.props.viewabilityConfigCallbackPairs ? this._virtualizedListPairs = this.props.viewabilityConfigCallbackPairs.map(pair => ({
      viewabilityConfig: pair.viewabilityConfig,
      onViewableItemsChanged: this._createOnViewableItemsChanged(pair.onViewableItemsChanged)
    })) : this.props.onViewableItemsChanged && this._virtualizedListPairs.push({
      viewabilityConfig: this.props.viewabilityConfig,
      onViewableItemsChanged: this._createOnViewableItemsChanged(this.props.onViewableItemsChanged)
    });
  }
  componentDidUpdate(prevProps) {
    (0, import_react_native_web_internals.invariant)(prevProps.numColumns === this.props.numColumns, "Changing numColumns on the fly is not supported. Change the key prop on FlatList when changing the number of columns to force a fresh render of the component."), (0, import_react_native_web_internals.invariant)(prevProps.onViewableItemsChanged === this.props.onViewableItemsChanged, "Changing onViewableItemsChanged on the fly is not supported"), (0, import_react_native_web_internals.invariant)(!(0, import_deepDiffer.deepDiffer)(prevProps.viewabilityConfig, this.props.viewabilityConfig), "Changing viewabilityConfig on the fly is not supported"), (0, import_react_native_web_internals.invariant)(prevProps.viewabilityConfigCallbackPairs === this.props.viewabilityConfigCallbackPairs, "Changing viewabilityConfigCallbackPairs on the fly is not supported"), this._checkProps(this.props);
  }
  _listRef;
  _virtualizedListPairs = [];
  _captureRef = ref => {
    this._listRef = ref;
  };
  _checkProps(props) {
    const {
        getItem,
        getItemCount,
        horizontal,
        columnWrapperStyle,
        onViewableItemsChanged,
        viewabilityConfigCallbackPairs
      } = props,
      numColumns = numColumnsOrDefault(this.props.numColumns);
    (0, import_react_native_web_internals.invariant)(!getItem && !getItemCount, "FlatList does not support custom data formats."), numColumns > 1 ? (0, import_react_native_web_internals.invariant)(!horizontal, "numColumns does not support horizontal.") : (0, import_react_native_web_internals.invariant)(!columnWrapperStyle, "columnWrapperStyle not supported for single column lists"), (0, import_react_native_web_internals.invariant)(!(onViewableItemsChanged && viewabilityConfigCallbackPairs), "FlatList does not support setting both onViewableItemsChanged and viewabilityConfigCallbackPairs.");
  }
  _getItem = (data, index) => {
    const numColumns = numColumnsOrDefault(this.props.numColumns);
    if (numColumns > 1) {
      const ret = [];
      for (let kk = 0; kk < numColumns; kk++) {
        const itemIndex = index * numColumns + kk;
        if (itemIndex < data.length) {
          const item = data[itemIndex];
          ret.push(item);
        }
      }
      return ret;
    } else return data[index];
  };
  _getItemCount = data => {
    if (data != null && isArrayLike(data)) {
      const numColumns = numColumnsOrDefault(this.props.numColumns);
      return numColumns > 1 ? Math.ceil(data.length / numColumns) : data.length;
    } else return 0;
  };
  _keyExtractor = (items, index) => {
    const numColumns = numColumnsOrDefault(this.props.numColumns),
      keyExtractor = this.props.keyExtractor ?? import_VirtualizeUtils.keyExtractor;
    return numColumns > 1 ? ((0, import_react_native_web_internals.invariant)(Array.isArray(items), "FlatList: Encountered internal consistency error, expected each item to consist of an array with 1-%s columns; instead, received a single item.", numColumns), items.map((item, kk) => keyExtractor(item, index * numColumns + kk)).join(":")) : keyExtractor(items, index);
  };
  _pushMultiColumnViewable(arr, v) {
    const numColumns = numColumnsOrDefault(this.props.numColumns),
      keyExtractor = this.props.keyExtractor ?? import_VirtualizeUtils.keyExtractor;
    v.item.forEach((item, ii) => {
      (0, import_react_native_web_internals.invariant)(v.index != null, "Missing index!");
      const index = v.index * numColumns + ii;
      arr.push({
        ...v,
        item,
        key: keyExtractor(item, index),
        index
      });
    });
  }
  _createOnViewableItemsChanged(onViewableItemsChanged) {
    return info => {
      const numColumns = numColumnsOrDefault(this.props.numColumns);
      if (onViewableItemsChanged) if (numColumns > 1) {
        const changed = [],
          viewableItems = [];
        info.viewableItems.forEach(v => this._pushMultiColumnViewable(viewableItems, v)), info.changed.forEach(v => this._pushMultiColumnViewable(changed, v)), onViewableItemsChanged({
          viewableItems,
          changed
        });
      } else onViewableItemsChanged(info);
    };
  }
  _renderer = (ListItemComponent, renderItem, columnWrapperStyle, numColumns, extraData) => {
    const cols = numColumnsOrDefault(numColumns),
      render = props => ListItemComponent ? /* @__PURE__ */(0, import_jsx_runtime.jsx)(ListItemComponent, {
        ...props
      }) : renderItem ? renderItem(props) : null,
      renderProp = info => {
        if (cols > 1) {
          const {
            item,
            index
          } = info;
          return (0, import_react_native_web_internals.invariant)(Array.isArray(item), "Expected array of items with numColumns > 1"), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_View.View, {
            style: [styles.row, columnWrapperStyle],
            children: item.map((it, kk) => {
              const element = render({
                item: it,
                index: index * cols + kk,
                separators: info.separators
              });
              return element != null ? /* @__PURE__ */(0, import_jsx_runtime.jsx)(React.Fragment, {
                children: element
              }, kk) : null;
            })
          });
        } else return render(info);
      };
    return ListItemComponent ? {
      ListItemComponent: renderProp
    } : {
      renderItem: renderProp
    };
  };
  // $FlowFixMe[missing-local-annot]
  _memoizedRenderer = (0, import_memoize_one.default)(this._renderer);
  render() {
    const {
        numColumns,
        columnWrapperStyle,
        removeClippedSubviews: _removeClippedSubviews,
        strictMode = !1,
        ...restProps
      } = this.props,
      renderer = strictMode ? this._memoizedRenderer : this._renderer;
    return /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_VirtualizedList.VirtualizedList, {
      ...restProps,
      getItem: this._getItem,
      getItemCount: this._getItemCount,
      keyExtractor: this._keyExtractor,
      ref: this._captureRef,
      viewabilityConfigCallbackPairs: this._virtualizedListPairs,
      removeClippedSubviews: removeClippedSubviewsOrDefault(_removeClippedSubviews),
      ...renderer(this.props.ListItemComponent, this.props.renderItem, columnWrapperStyle, numColumns, this.props.extraData)
    });
  }
}
const styles = import_react_native_web_internals.StyleSheet.create({
  row: {
    flexDirection: "row"
  }
});
var FlatList_default = FlatList;