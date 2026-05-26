
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const ACSetupSvcPort: string;
	export const ACSvcPort: string;
	export const ALLUSERSPROFILE: string;
	export const ANTHROPIC_AUTH_TOKEN: string;
	export const ANTHROPIC_BASE_URL: string;
	export const ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
	export const ANTHROPIC_DEFAULT_OPUS_MODEL: string;
	export const ANTHROPIC_DEFAULT_SONNET_MODEL: string;
	export const ANTHROPIC_MODEL: string;
	export const APPCODE_VM_OPTIONS: string;
	export const APPDATA: string;
	export const AQUA_VM_OPTIONS: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const CLAUDECODE: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const CLAUDE_CODE_EXECPATH: string;
	export const CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
	export const CLION_VM_OPTIONS: string;
	export const COLOR: string;
	export const COLORTERM: string;
	export const COMMONPROGRAMFILES: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const COMSPEC: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const CPOLAR_HOME: string;
	export const DATAGRIP_VM_OPTIONS: string;
	export const DATASPELL_VM_OPTIONS: string;
	export const DEVECOSTUDIO_VM_OPTIONS: string;
	export const DISABLE_AUTOUPDATER: string;
	export const DriverData: string;
	export const EDITOR: string;
	export const EFC_10276_1592913036: string;
	export const EnableLog: string;
	export const ENABLE_TOOL_SEARCH: string;
	export const EXEPATH: string;
	export const GATEWAY_VM_OPTIONS: string;
	export const GIT_ASKPASS: string;
	export const GIT_EDITOR: string;
	export const GoLand: string;
	export const GOLAND_VM_OPTIONS: string;
	export const HOME: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const IDEA_VM_OPTIONS: string;
	export const IGCCSVC_DB: string;
	export const INIT_CWD: string;
	export const JETBRAINSCLIENT_VM_OPTIONS: string;
	export const JETBRAINS_CLIENT_VM_OPTIONS: string;
	export const LANG: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const MSYSTEM: string;
	export const NODE: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const NODE_ENV: string;
	export const NODE_PATH: string;
	export const npm_command: string;
	export const npm_config_cache: string;
	export const npm_config_globalconfig: string;
	export const npm_config_global_prefix: string;
	export const npm_config_home: string;
	export const npm_config_init_module: string;
	export const npm_config_local_prefix: string;
	export const npm_config_node_gyp: string;
	export const npm_config_noproxy: string;
	export const npm_config_npm_version: string;
	export const npm_config_prefix: string;
	export const npm_config_userconfig: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const npm_lifecycle_event: string;
	export const npm_lifecycle_script: string;
	export const npm_node_execpath: string;
	export const npm_package_json: string;
	export const npm_package_name: string;
	export const npm_package_version: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const NVM_HOME: string;
	export const NVM_SYMLINK: string;
	export const OLDPWD: string;
	export const OneDrive: string;
	export const OS: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const PATH: string;
	export const PATHEXT: string;
	export const PHPSTORM_VM_OPTIONS: string;
	export const PLINK_PROTOCOL: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const ProgramData: string;
	export const PROGRAMFILES: string;
	export const ProgramW6432: string;
	export const PROMPT: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const PWD: string;
	export const PYCHARM_VM_OPTIONS: string;
	export const RIDER_VM_OPTIONS: string;
	export const RlsSvcPort: string;
	export const RUBYMINE_VM_OPTIONS: string;
	export const RUSTROVER_VM_OPTIONS: string;
	export const SESSIONNAME: string;
	export const SHELL: string;
	export const SHLVL: string;
	export const STUDIO_VM_OPTIONS: string;
	export const SYSTEMDRIVE: string;
	export const SYSTEMROOT: string;
	export const TEMP: string;
	export const TERM: string;
	export const TERM_PROGRAM: string;
	export const TERM_PROGRAM_VERSION: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const USERNAME: string;
	export const USERPROFILE: string;
	export const VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
	export const VSCODE_GIT_ASKPASS_MAIN: string;
	export const VSCODE_GIT_ASKPASS_NODE: string;
	export const VSCODE_GIT_IPC_HANDLE: string;
	export const VSCODE_INJECTION: string;
	export const VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
	export const WEBIDE_VM_OPTIONS: string;
	export const WebStorm: string;
	export const WEBSTORM_VM_OPTIONS: string;
	export const WINDIR: string;
	export const ZES_ENABLE_SYSMAN: string;
	export const _: string;
	export const __COMPAT_LAYER: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		ACSetupSvcPort: string;
		ACSvcPort: string;
		ALLUSERSPROFILE: string;
		ANTHROPIC_AUTH_TOKEN: string;
		ANTHROPIC_BASE_URL: string;
		ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
		ANTHROPIC_DEFAULT_OPUS_MODEL: string;
		ANTHROPIC_DEFAULT_SONNET_MODEL: string;
		ANTHROPIC_MODEL: string;
		APPCODE_VM_OPTIONS: string;
		APPDATA: string;
		AQUA_VM_OPTIONS: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		CLAUDECODE: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		CLAUDE_CODE_EXECPATH: string;
		CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
		CLION_VM_OPTIONS: string;
		COLOR: string;
		COLORTERM: string;
		COMMONPROGRAMFILES: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		COMSPEC: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		CPOLAR_HOME: string;
		DATAGRIP_VM_OPTIONS: string;
		DATASPELL_VM_OPTIONS: string;
		DEVECOSTUDIO_VM_OPTIONS: string;
		DISABLE_AUTOUPDATER: string;
		DriverData: string;
		EDITOR: string;
		EFC_10276_1592913036: string;
		EnableLog: string;
		ENABLE_TOOL_SEARCH: string;
		EXEPATH: string;
		GATEWAY_VM_OPTIONS: string;
		GIT_ASKPASS: string;
		GIT_EDITOR: string;
		GoLand: string;
		GOLAND_VM_OPTIONS: string;
		HOME: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		IDEA_VM_OPTIONS: string;
		IGCCSVC_DB: string;
		INIT_CWD: string;
		JETBRAINSCLIENT_VM_OPTIONS: string;
		JETBRAINS_CLIENT_VM_OPTIONS: string;
		LANG: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		MSYSTEM: string;
		NODE: string;
		NoDefaultCurrentDirectoryInExePath: string;
		NODE_ENV: string;
		NODE_PATH: string;
		npm_command: string;
		npm_config_cache: string;
		npm_config_globalconfig: string;
		npm_config_global_prefix: string;
		npm_config_home: string;
		npm_config_init_module: string;
		npm_config_local_prefix: string;
		npm_config_node_gyp: string;
		npm_config_noproxy: string;
		npm_config_npm_version: string;
		npm_config_prefix: string;
		npm_config_userconfig: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		npm_lifecycle_event: string;
		npm_lifecycle_script: string;
		npm_node_execpath: string;
		npm_package_json: string;
		npm_package_name: string;
		npm_package_version: string;
		NUMBER_OF_PROCESSORS: string;
		NVM_HOME: string;
		NVM_SYMLINK: string;
		OLDPWD: string;
		OneDrive: string;
		OS: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		PATH: string;
		PATHEXT: string;
		PHPSTORM_VM_OPTIONS: string;
		PLINK_PROTOCOL: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_IDENTIFIER: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		ProgramData: string;
		PROGRAMFILES: string;
		ProgramW6432: string;
		PROMPT: string;
		PSModulePath: string;
		PUBLIC: string;
		PWD: string;
		PYCHARM_VM_OPTIONS: string;
		RIDER_VM_OPTIONS: string;
		RlsSvcPort: string;
		RUBYMINE_VM_OPTIONS: string;
		RUSTROVER_VM_OPTIONS: string;
		SESSIONNAME: string;
		SHELL: string;
		SHLVL: string;
		STUDIO_VM_OPTIONS: string;
		SYSTEMDRIVE: string;
		SYSTEMROOT: string;
		TEMP: string;
		TERM: string;
		TERM_PROGRAM: string;
		TERM_PROGRAM_VERSION: string;
		TMP: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		USERNAME: string;
		USERPROFILE: string;
		VSCODE_GIT_ASKPASS_EXTRA_ARGS: string;
		VSCODE_GIT_ASKPASS_MAIN: string;
		VSCODE_GIT_ASKPASS_NODE: string;
		VSCODE_GIT_IPC_HANDLE: string;
		VSCODE_INJECTION: string;
		VSCODE_PYTHON_AUTOACTIVATE_GUARD: string;
		WEBIDE_VM_OPTIONS: string;
		WebStorm: string;
		WEBSTORM_VM_OPTIONS: string;
		WINDIR: string;
		ZES_ENABLE_SYSMAN: string;
		_: string;
		__COMPAT_LAYER: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * Dynamic environment variables cannot be used during prerendering.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
