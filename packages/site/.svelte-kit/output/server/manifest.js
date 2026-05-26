export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {"start":"_app/immutable/entry/start.DXGAF1ha.js","app":"_app/immutable/entry/app.B6MimP7X.js","imports":["_app/immutable/entry/start.DXGAF1ha.js","_app/immutable/chunks/entry.BlZEh-MS.js","_app/immutable/chunks/scheduler.CNwRqMkk.js","_app/immutable/chunks/index.BLAEFYc9.js","_app/immutable/entry/app.B6MimP7X.js","_app/immutable/chunks/scheduler.CNwRqMkk.js","_app/immutable/chunks/index.07a8Qjgb.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		routes: [
			
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
