import * as vscode from "vscode";

import Log from "../../Logger";

/**
 * Store & load the mappings of ingress URLs to master node IPs.
 * This is done separately from the Connections because we want it to persist until overwritten with new data,
 * and there isn't really any reason this info would change, even if microclimate is reinstalled.
 */
namespace ICPInfoMap {
    export async function updateICPInfoMap(ingressUrl_: vscode.Uri, masterHost: string): Promise<void> {
        const ingressUrl: string = normalize(ingressUrl_);
        // should this be a user-visible setting?
        const extensionContext = global.extGlobalState as vscode.Memento;

        const oldValue = extensionContext.get<string>(ingressUrl);
        await extensionContext.update(ingressUrl, masterHost);
        if (oldValue !== masterHost) {
            Log.d(`The master node for ${ingressUrl} is now ${masterHost}`);
        }
    }

    export function getMasterHost(ingressUrl_: vscode.Uri): string | undefined {
        const ingressUrl: string = normalize(ingressUrl_);
        const extensionContext = global.extGlobalState as vscode.Memento;
        return extensionContext.get<string>(ingressUrl);
    }

    function normalize(url: vscode.Uri): string {
        return url.with({ path: "" }).toString();
    }
}

export default ICPInfoMap;