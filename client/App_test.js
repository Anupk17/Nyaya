import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");const React = __vite__cjsImport0_react; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport10_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=747667f3";
import { BrowserRouter as Router, Routes, Route } from "/node_modules/.vite/deps/react-router-dom.js?v=6dee96da";
import Sidebar from "/src/components/Sidebar.jsx?t=1789666916877";
import TopHeader from "/src/components/TopHeader.jsx";
import HistoryPanel from "/src/components/HistoryPanel.jsx";
import AIChatWorkspace from "/src/pages/AIChatWorkspace.jsx";
import Dashboard from "/src/pages/Dashboard.jsx";
import CaseDetail from "/src/pages/CaseDetail.jsx";
import Impact from "/src/pages/Impact.jsx";
import LiveDispute from "/src/pages/LiveDispute.jsx";
var _jsxFileName = "D:/projects/NYAYA/client/src/App.jsx";
import __vite__cjsImport10_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=747667f3";
var _s = $RefreshSig$();
function App() {
	_s();
	const [isHistoryOpen, setIsHistoryOpen] = useState(true);
	const [useBedrock, setUseBedrock] = useState(false);
	return /* @__PURE__ */ _jsxDEV(Router, { children: /* @__PURE__ */ _jsxDEV("div", {
		style: {
			display: "grid",
			gridTemplateColumns: isHistoryOpen ? "240px 1fr 280px" : "240px 1fr",
			height: "100vh",
			overflow: "hidden",
			background: "#F8F9FA"
		},
		children: [
			/* @__PURE__ */ _jsxDEV(Sidebar, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 28,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					minWidth: 0
				},
				children: [/* @__PURE__ */ _jsxDEV(TopHeader, {
					isHistoryOpen,
					setIsHistoryOpen,
					useBedrock,
					setUseBedrock
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 32,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					style: {
						flex: 1,
						overflow: "hidden",
						position: "relative"
					},
					children: /* @__PURE__ */ _jsxDEV(Routes, { children: [
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/",
							element: /* @__PURE__ */ _jsxDEV(AIChatWorkspace, { useBedrock }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 41,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 41,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/chat",
							element: /* @__PURE__ */ _jsxDEV(AIChatWorkspace, { useBedrock }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 42,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 42,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/live-dispute",
							element: /* @__PURE__ */ _jsxDEV(LiveDispute, { useBedrock }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 43,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 43,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/cases",
							element: /* @__PURE__ */ _jsxDEV(Dashboard, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 44,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 44,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/case/:id",
							element: /* @__PURE__ */ _jsxDEV(CaseDetail, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 45,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 45,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV(Route, {
							path: "/impact",
							element: /* @__PURE__ */ _jsxDEV(Impact, {}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 46,
								columnNumber: 52
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 46,
							columnNumber: 15
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 40,
						columnNumber: 13
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 39,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 31,
				columnNumber: 9
			}, this),
			isHistoryOpen && /* @__PURE__ */ _jsxDEV(HistoryPanel, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 52,
				columnNumber: 27
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 18,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 17,
		columnNumber: 5
	}, this);
}
_s(App, "lrjZSOBFVLdZ9R9ROlVMTslKN1k=");
_c = App;
export default App;
var _c;
$RefreshReg$(_c, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.jsx?t=1789666916877";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("D:/projects/NYAYA/client/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("D:/projects/NYAYA/client/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "D:/projects/NYAYA/client/src/App.jsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLGdCQUFnQjtBQUNoQyxTQUFTLGlCQUFpQixRQUFRLFFBQVEsYUFBYTtBQUN2RCxPQUFPLGFBQWE7QUFDcEIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8scUJBQXFCO0FBQzVCLE9BQU8sZUFBZTtBQUN0QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLFlBQVk7QUFDbkIsT0FBTyxpQkFBaUI7Ozs7QUFFeEIsU0FBUyxNQUFNOztDQUNiLE1BQU0sQ0FBQyxlQUFlLG9CQUFvQixTQUFTLElBQUk7Q0FDdkQsTUFBTSxDQUFDLFlBQVksaUJBQWlCLFNBQVMsS0FBSztDQUVsRCxPQUNFLHdCQUFDLFFBQUQsWUFDRSx3QkFBQyxPQUFEO0VBQ0UsT0FBTztHQUNMLFNBQVM7R0FDVCxxQkFBcUIsZ0JBQWdCLG9CQUFvQjtHQUN6RCxRQUFRO0dBQ1IsVUFBVTtHQUNWLFlBQVk7RUFDZDtZQVBGO0dBVUUsd0JBQUMsU0FBRCxDQUFVOzs7OztHQUdWLHdCQUFDLE9BQUQ7SUFBSyxPQUFPO0tBQUUsU0FBUztLQUFRLGVBQWU7S0FBVSxVQUFVO0tBQVUsVUFBVTtJQUFFO2NBQXhGLENBQ0Usd0JBQUMsV0FBRDtLQUNpQjtLQUNHO0tBQ047S0FDRztJQUNoQjs7OztjQUVELHdCQUFDLE9BQUQ7S0FBSyxPQUFPO01BQUUsTUFBTTtNQUFHLFVBQVU7TUFBVSxVQUFVO0tBQVc7ZUFDOUQsd0JBQUMsUUFBRDtNQUNFLHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQWdCLFNBQVMsd0JBQUMsaUJBQUQsRUFBNkIsV0FBYTs7Ozs7TUFBSTs7Ozs7TUFDbkYsd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBZ0IsU0FBUyx3QkFBQyxpQkFBRCxFQUE2QixXQUFhOzs7OztNQUFJOzs7OztNQUNuRix3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFnQixTQUFTLHdCQUFDLGFBQUQsRUFBeUIsV0FBYTs7Ozs7TUFBSTs7Ozs7TUFDL0Usd0JBQUMsT0FBRDtPQUFPLE1BQUs7T0FBZ0IsU0FBUyx3QkFBQyxXQUFELENBQVk7Ozs7O01BQUk7Ozs7O01BQ3JELHdCQUFDLE9BQUQ7T0FBTyxNQUFLO09BQWdCLFNBQVMsd0JBQUMsWUFBRCxDQUFhOzs7OztNQUFJOzs7OztNQUN0RCx3QkFBQyxPQUFEO09BQU8sTUFBSztPQUFnQixTQUFTLHdCQUFDLFFBQUQsQ0FBUzs7Ozs7TUFBSTs7Ozs7S0FDNUM7Ozs7O0lBQ0w7Ozs7WUFDRjs7Ozs7O0dBR0osaUJBQWlCLHdCQUFDLGNBQUQsQ0FBZTs7Ozs7RUFDOUI7Ozs7O1VBQ0M7Ozs7O0FBRVo7OztBQUVBLGVBQWUiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXBwLmpzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCcm93c2VyUm91dGVyIGFzIFJvdXRlciwgUm91dGVzLCBSb3V0ZSB9IGZyb20gJ3JlYWN0LXJvdXRlci1kb20nO1xuaW1wb3J0IFNpZGViYXIgZnJvbSAnLi9jb21wb25lbnRzL1NpZGViYXInO1xuaW1wb3J0IFRvcEhlYWRlciBmcm9tICcuL2NvbXBvbmVudHMvVG9wSGVhZGVyJztcbmltcG9ydCBIaXN0b3J5UGFuZWwgZnJvbSAnLi9jb21wb25lbnRzL0hpc3RvcnlQYW5lbCc7XG5pbXBvcnQgQUlDaGF0V29ya3NwYWNlIGZyb20gJy4vcGFnZXMvQUlDaGF0V29ya3NwYWNlJztcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi9wYWdlcy9EYXNoYm9hcmQnO1xuaW1wb3J0IENhc2VEZXRhaWwgZnJvbSAnLi9wYWdlcy9DYXNlRGV0YWlsJztcbmltcG9ydCBJbXBhY3QgZnJvbSAnLi9wYWdlcy9JbXBhY3QnO1xuaW1wb3J0IExpdmVEaXNwdXRlIGZyb20gJy4vcGFnZXMvTGl2ZURpc3B1dGUnO1xuXG5mdW5jdGlvbiBBcHAoKSB7XG4gIGNvbnN0IFtpc0hpc3RvcnlPcGVuLCBzZXRJc0hpc3RvcnlPcGVuXSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBbdXNlQmVkcm9jaywgc2V0VXNlQmVkcm9ja10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8Um91dGVyPlxuICAgICAgPGRpdlxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIGRpc3BsYXk6ICdncmlkJyxcbiAgICAgICAgICBncmlkVGVtcGxhdGVDb2x1bW5zOiBpc0hpc3RvcnlPcGVuID8gJzI0MHB4IDFmciAyODBweCcgOiAnMjQwcHggMWZyJyxcbiAgICAgICAgICBoZWlnaHQ6ICcxMDB2aCcsXG4gICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgIGJhY2tncm91bmQ6ICcjRjhGOUZBJyxcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAgey8qIExlZnQgU2lkZWJhciAqL31cbiAgICAgICAgPFNpZGViYXIgLz5cblxuICAgICAgICB7LyogQ2VudGVyIFBhbmVsICovfVxuICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIG92ZXJmbG93OiAnaGlkZGVuJywgbWluV2lkdGg6IDAgfX0+XG4gICAgICAgICAgPFRvcEhlYWRlclxuICAgICAgICAgICAgaXNIaXN0b3J5T3Blbj17aXNIaXN0b3J5T3Blbn1cbiAgICAgICAgICAgIHNldElzSGlzdG9yeU9wZW49e3NldElzSGlzdG9yeU9wZW59XG4gICAgICAgICAgICB1c2VCZWRyb2NrPXt1c2VCZWRyb2NrfVxuICAgICAgICAgICAgc2V0VXNlQmVkcm9jaz17c2V0VXNlQmVkcm9ja31cbiAgICAgICAgICAvPlxuICAgICAgICAgIHsvKiBDb250ZW50IOKAlCBlYWNoIHBhZ2UgbWFuYWdlcyBpdHMgb3duIHNjcm9sbCAqL31cbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGZsZXg6IDEsIG92ZXJmbG93OiAnaGlkZGVuJywgcG9zaXRpb246ICdyZWxhdGl2ZScgfX0+XG4gICAgICAgICAgICA8Um91dGVzPlxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9cIiAgICAgICAgICAgICBlbGVtZW50PXs8QUlDaGF0V29ya3NwYWNlIHVzZUJlZHJvY2s9e3VzZUJlZHJvY2t9IC8+fSAvPlxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9jaGF0XCIgICAgICAgICBlbGVtZW50PXs8QUlDaGF0V29ya3NwYWNlIHVzZUJlZHJvY2s9e3VzZUJlZHJvY2t9IC8+fSAvPlxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9saXZlLWRpc3B1dGVcIiBlbGVtZW50PXs8TGl2ZURpc3B1dGUgdXNlQmVkcm9jaz17dXNlQmVkcm9ja30gLz59IC8+XG4gICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2Nhc2VzXCIgICAgICAgIGVsZW1lbnQ9ezxEYXNoYm9hcmQgLz59IC8+XG4gICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL2Nhc2UvOmlkXCIgICAgIGVsZW1lbnQ9ezxDYXNlRGV0YWlsIC8+fSAvPlxuICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9pbXBhY3RcIiAgICAgICBlbGVtZW50PXs8SW1wYWN0IC8+fSAvPlxuICAgICAgICAgICAgPC9Sb3V0ZXM+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBSaWdodCBIaXN0b3J5IFBhbmVsICovfVxuICAgICAgICB7aXNIaXN0b3J5T3BlbiAmJiA8SGlzdG9yeVBhbmVsIC8+fVxuICAgICAgPC9kaXY+XG4gICAgPC9Sb3V0ZXI+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiJdfQ==