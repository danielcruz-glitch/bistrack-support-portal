/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/admin/users/[id]/update/route";
exports.ids = ["app/api/admin/users/[id]/update/route"];
exports.modules = {

/***/ "(rsc)/./app/api/admin/users/[id]/update/route.ts":
/*!**************************************************!*\
  !*** ./app/api/admin/users/[id]/update/route.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   PATCH: () => (/* binding */ PATCH)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_supabase_admin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/supabase/admin */ \"(rsc)/./lib/supabase/admin.ts\");\n\n\nasync function PATCH(req, context) {\n    try {\n        const { id } = await context.params;\n        const body = await req.json();\n        const supabase = (0,_lib_supabase_admin__WEBPACK_IMPORTED_MODULE_1__.createAdminClient)();\n        const role = body.role;\n        const hourlyRate = role === \"admin\" || role === \"support\" ? Number(body.hourly_rate) : null;\n        if ((role === \"admin\" || role === \"support\") && (!hourlyRate || hourlyRate <= 0)) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Admin and support users must have a valid hourly rate.\"\n            }, {\n                status: 400\n            });\n        }\n        const { error } = await supabase.from(\"profiles\").update({\n            full_name: body.full_name,\n            email: body.email,\n            department: body.department,\n            role,\n            hourly_rate: hourlyRate,\n            is_active: Boolean(body.is_active)\n        }).eq(\"id\", id);\n        if (error) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: error.message\n            }, {\n                status: 500\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true\n        });\n    } catch (error) {\n        console.error(\"Update user error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Failed to update user.\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FkbWluL3VzZXJzL1tpZF0vdXBkYXRlL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUEyQztBQUNjO0FBTWxELGVBQWVFLE1BQU1DLEdBQVksRUFBRUMsT0FBcUI7SUFDN0QsSUFBSTtRQUNGLE1BQU0sRUFBRUMsRUFBRSxFQUFFLEdBQUcsTUFBTUQsUUFBUUUsTUFBTTtRQUNuQyxNQUFNQyxPQUFPLE1BQU1KLElBQUlLLElBQUk7UUFDM0IsTUFBTUMsV0FBV1Isc0VBQWlCQTtRQUVsQyxNQUFNUyxPQUFPSCxLQUFLRyxJQUFJO1FBQ3RCLE1BQU1DLGFBQ0pELFNBQVMsV0FBV0EsU0FBUyxZQUN6QkUsT0FBT0wsS0FBS00sV0FBVyxJQUN2QjtRQUVOLElBQUksQ0FBQ0gsU0FBUyxXQUFXQSxTQUFTLFNBQVEsS0FBTyxFQUFDQyxjQUFjQSxjQUFjLElBQUk7WUFDaEYsT0FBT1gscURBQVlBLENBQUNRLElBQUksQ0FDdEI7Z0JBQUVNLE9BQU87WUFBeUQsR0FDbEU7Z0JBQUVDLFFBQVE7WUFBSTtRQUVsQjtRQUVBLE1BQU0sRUFBRUQsS0FBSyxFQUFFLEdBQUcsTUFBTUwsU0FDckJPLElBQUksQ0FBQyxZQUNMQyxNQUFNLENBQUM7WUFDTkMsV0FBV1gsS0FBS1csU0FBUztZQUN6QkMsT0FBT1osS0FBS1ksS0FBSztZQUNqQkMsWUFBWWIsS0FBS2EsVUFBVTtZQUMzQlY7WUFDQUcsYUFBYUY7WUFDYlUsV0FBV0MsUUFBUWYsS0FBS2MsU0FBUztRQUNuQyxHQUNDRSxFQUFFLENBQUMsTUFBTWxCO1FBRVosSUFBSVMsT0FBTztZQUNULE9BQU9kLHFEQUFZQSxDQUFDUSxJQUFJLENBQUM7Z0JBQUVNLE9BQU9BLE1BQU1VLE9BQU87WUFBQyxHQUFHO2dCQUFFVCxRQUFRO1lBQUk7UUFDbkU7UUFFQSxPQUFPZixxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVpQixTQUFTO1FBQUs7SUFDM0MsRUFBRSxPQUFPWCxPQUFPO1FBQ2RZLFFBQVFaLEtBQUssQ0FBQyxzQkFBc0JBO1FBQ3BDLE9BQU9kLHFEQUFZQSxDQUFDUSxJQUFJLENBQ3RCO1lBQUVNLE9BQU87UUFBeUIsR0FDbEM7WUFBRUMsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcY3J1emRcXERvY3VtZW50c1xcUHVyc3VpdFxcYmlzdHJhY2stc3VwcG9ydC1wb3J0YWxcXGJpc3RyYWNrLXN1cHBvcnQtcG9ydGFsXFxhcHBcXGFwaVxcYWRtaW5cXHVzZXJzXFxbaWRdXFx1cGRhdGVcXHJvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xyXG5pbXBvcnQgeyBjcmVhdGVBZG1pbkNsaWVudCB9IGZyb20gXCJAL2xpYi9zdXBhYmFzZS9hZG1pblwiO1xyXG5cclxudHlwZSBSb3V0ZUNvbnRleHQgPSB7XHJcbiAgcGFyYW1zOiBQcm9taXNlPHsgaWQ6IHN0cmluZyB9PjtcclxufTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQQVRDSChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IFJvdXRlQ29udGV4dCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGlkIH0gPSBhd2FpdCBjb250ZXh0LnBhcmFtcztcclxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXEuanNvbigpO1xyXG4gICAgY29uc3Qgc3VwYWJhc2UgPSBjcmVhdGVBZG1pbkNsaWVudCgpO1xyXG5cclxuICAgIGNvbnN0IHJvbGUgPSBib2R5LnJvbGU7XHJcbiAgICBjb25zdCBob3VybHlSYXRlID1cclxuICAgICAgcm9sZSA9PT0gXCJhZG1pblwiIHx8IHJvbGUgPT09IFwic3VwcG9ydFwiXHJcbiAgICAgICAgPyBOdW1iZXIoYm9keS5ob3VybHlfcmF0ZSlcclxuICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgaWYgKChyb2xlID09PSBcImFkbWluXCIgfHwgcm9sZSA9PT0gXCJzdXBwb3J0XCIpICYmICghaG91cmx5UmF0ZSB8fCBob3VybHlSYXRlIDw9IDApKSB7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcclxuICAgICAgICB7IGVycm9yOiBcIkFkbWluIGFuZCBzdXBwb3J0IHVzZXJzIG11c3QgaGF2ZSBhIHZhbGlkIGhvdXJseSByYXRlLlwiIH0sXHJcbiAgICAgICAgeyBzdGF0dXM6IDQwMCB9XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcclxuICAgICAgLmZyb20oXCJwcm9maWxlc1wiKVxyXG4gICAgICAudXBkYXRlKHtcclxuICAgICAgICBmdWxsX25hbWU6IGJvZHkuZnVsbF9uYW1lLFxyXG4gICAgICAgIGVtYWlsOiBib2R5LmVtYWlsLFxyXG4gICAgICAgIGRlcGFydG1lbnQ6IGJvZHkuZGVwYXJ0bWVudCxcclxuICAgICAgICByb2xlLFxyXG4gICAgICAgIGhvdXJseV9yYXRlOiBob3VybHlSYXRlLFxyXG4gICAgICAgIGlzX2FjdGl2ZTogQm9vbGVhbihib2R5LmlzX2FjdGl2ZSksXHJcbiAgICAgIH0pXHJcbiAgICAgIC5lcShcImlkXCIsIGlkKTtcclxuXHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwiVXBkYXRlIHVzZXIgZXJyb3I6XCIsIGVycm9yKTtcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcclxuICAgICAgeyBlcnJvcjogXCJGYWlsZWQgdG8gdXBkYXRlIHVzZXIuXCIgfSxcclxuICAgICAgeyBzdGF0dXM6IDUwMCB9XHJcbiAgICApO1xyXG4gIH1cclxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVBZG1pbkNsaWVudCIsIlBBVENIIiwicmVxIiwiY29udGV4dCIsImlkIiwicGFyYW1zIiwiYm9keSIsImpzb24iLCJzdXBhYmFzZSIsInJvbGUiLCJob3VybHlSYXRlIiwiTnVtYmVyIiwiaG91cmx5X3JhdGUiLCJlcnJvciIsInN0YXR1cyIsImZyb20iLCJ1cGRhdGUiLCJmdWxsX25hbWUiLCJlbWFpbCIsImRlcGFydG1lbnQiLCJpc19hY3RpdmUiLCJCb29sZWFuIiwiZXEiLCJtZXNzYWdlIiwic3VjY2VzcyIsImNvbnNvbGUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/admin/users/[id]/update/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/supabase/admin.ts":
/*!*******************************!*\
  !*** ./lib/supabase/admin.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createAdminClient: () => (/* binding */ createAdminClient)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/index.mjs\");\n\nfunction createAdminClient() {\n    const supabaseUrl = \"https://bbgfhuyvbqwjzjelcoty.supabase.co\";\n    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;\n    if (!supabaseUrl) {\n        throw new Error(\"Missing NEXT_PUBLIC_SUPABASE_URL\");\n    }\n    if (!serviceRoleKey) {\n        throw new Error(\"Missing SUPABASE_SERVICE_ROLE_KEY\");\n    }\n    return (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, serviceRoleKey, {\n        auth: {\n            autoRefreshToken: false,\n            persistSession: false\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvc3VwYWJhc2UvYWRtaW4udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBcUQ7QUFFOUMsU0FBU0M7SUFDZCxNQUFNQyxjQUFjQywwQ0FBb0M7SUFDeEQsTUFBTUcsaUJBQWlCSCxRQUFRQyxHQUFHLENBQUNHLHlCQUF5QjtJQUU1RCxJQUFJLENBQUNMLGFBQWE7UUFDaEIsTUFBTSxJQUFJTSxNQUFNO0lBQ2xCO0lBRUEsSUFBSSxDQUFDRixnQkFBZ0I7UUFDbkIsTUFBTSxJQUFJRSxNQUFNO0lBQ2xCO0lBRUEsT0FBT1IsbUVBQVlBLENBQUNFLGFBQWFJLGdCQUFnQjtRQUMvQ0csTUFBTTtZQUNKQyxrQkFBa0I7WUFDbEJDLGdCQUFnQjtRQUNsQjtJQUNGO0FBQ0YiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcY3J1emRcXERvY3VtZW50c1xcUHVyc3VpdFxcYmlzdHJhY2stc3VwcG9ydC1wb3J0YWxcXGJpc3RyYWNrLXN1cHBvcnQtcG9ydGFsXFxsaWJcXHN1cGFiYXNlXFxhZG1pbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBZG1pbkNsaWVudCgpIHtcbiAgY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkw7XG4gIGNvbnN0IHNlcnZpY2VSb2xlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWTtcblxuICBpZiAoIXN1cGFiYXNlVXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkxcIik7XG4gIH1cblxuICBpZiAoIXNlcnZpY2VSb2xlS2V5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZXCIpO1xuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZUNsaWVudChzdXBhYmFzZVVybCwgc2VydmljZVJvbGVLZXksIHtcbiAgICBhdXRoOiB7XG4gICAgICBhdXRvUmVmcmVzaFRva2VuOiBmYWxzZSxcbiAgICAgIHBlcnNpc3RTZXNzaW9uOiBmYWxzZSxcbiAgICB9LFxuICB9KTtcbn0iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50IiwiY3JlYXRlQWRtaW5DbGllbnQiLCJzdXBhYmFzZVVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJzZXJ2aWNlUm9sZUtleSIsIlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkiLCJFcnJvciIsImF1dGgiLCJhdXRvUmVmcmVzaFRva2VuIiwicGVyc2lzdFNlc3Npb24iXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/supabase/admin.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&page=%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute.ts&appDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&page=%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute.ts&appDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_cruzd_Documents_Pursuit_bistrack_support_portal_bistrack_support_portal_app_api_admin_users_id_update_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/admin/users/[id]/update/route.ts */ \"(rsc)/./app/api/admin/users/[id]/update/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/users/[id]/update/route\",\n        pathname: \"/api/admin/users/[id]/update\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/users/[id]/update/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\cruzd\\\\Documents\\\\Pursuit\\\\bistrack-support-portal\\\\bistrack-support-portal\\\\app\\\\api\\\\admin\\\\users\\\\[id]\\\\update\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_cruzd_Documents_Pursuit_bistrack_support_portal_bistrack_support_portal_app_api_admin_users_id_update_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRnVzZXJzJTJGJTVCaWQlNUQlMkZ1cGRhdGUlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmFkbWluJTJGdXNlcnMlMkYlNUJpZCU1RCUyRnVwZGF0ZSUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmFkbWluJTJGdXNlcnMlMkYlNUJpZCU1RCUyRnVwZGF0ZSUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNjcnV6ZCU1Q0RvY3VtZW50cyU1Q1B1cnN1aXQlNUNiaXN0cmFjay1zdXBwb3J0LXBvcnRhbCU1Q2Jpc3RyYWNrLXN1cHBvcnQtcG9ydGFsJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNjcnV6ZCU1Q0RvY3VtZW50cyU1Q1B1cnN1aXQlNUNiaXN0cmFjay1zdXBwb3J0LXBvcnRhbCU1Q2Jpc3RyYWNrLXN1cHBvcnQtcG9ydGFsJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNzRjtBQUNuSztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcY3J1emRcXFxcRG9jdW1lbnRzXFxcXFB1cnN1aXRcXFxcYmlzdHJhY2stc3VwcG9ydC1wb3J0YWxcXFxcYmlzdHJhY2stc3VwcG9ydC1wb3J0YWxcXFxcYXBwXFxcXGFwaVxcXFxhZG1pblxcXFx1c2Vyc1xcXFxbaWRdXFxcXHVwZGF0ZVxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYWRtaW4vdXNlcnMvW2lkXS91cGRhdGUvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9hZG1pbi91c2Vycy9baWRdL3VwZGF0ZVwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYWRtaW4vdXNlcnMvW2lkXS91cGRhdGUvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxjcnV6ZFxcXFxEb2N1bWVudHNcXFxcUHVyc3VpdFxcXFxiaXN0cmFjay1zdXBwb3J0LXBvcnRhbFxcXFxiaXN0cmFjay1zdXBwb3J0LXBvcnRhbFxcXFxhcHBcXFxcYXBpXFxcXGFkbWluXFxcXHVzZXJzXFxcXFtpZF1cXFxcdXBkYXRlXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&page=%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute.ts&appDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tslib","vendor-chunks/iceberg-js"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&page=%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fusers%2F%5Bid%5D%2Fupdate%2Froute.ts&appDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Ccruzd%5CDocuments%5CPursuit%5Cbistrack-support-portal%5Cbistrack-support-portal&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();