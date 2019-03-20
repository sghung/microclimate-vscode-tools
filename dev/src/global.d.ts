/*******************************************************************************
 * Copyright (c) 2018, 2019 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/


// non-nls-file

// This allows extending the Global namespace so we can have our own global variables.
// The only reason to add stuff here is if we can set it once in extension.activate,
// and then never modify it again (only read).
declare namespace NodeJS {
    export interface Global {
        // Hold plugin root path so files don't each have to write their own logic to locate it using relative paths.
        /**
         * Path to the plugin's root folder.
         * This is the folder which contains /src and /res, for example.
         */
        __extRoot: string,

        // For some reason, importing anything at the top of this file causes all the properties declared here to not work anymore.
        // So, we use 'any' for extGlobalState - but it's a vscode.Memento.
        /**
         * A `vscode.Memento` storing extension state data we want to persist, but not let the user edit.
         */
        extGlobalState: any
    }
}

/**
 * Sadly, this very good library does not have types available.
 */
declare module "openid-client" {
    export const Issuer: any;
}

/**
 * Represents a response from a KubernetesClient.get call
 */
declare interface KubeResponse {
    readonly statusCode: number;
    readonly body: {
        readonly kind: string;
        readonly apiVersion: string;
        readonly metadata: KubeMetadata;
        readonly items: KubeItem[];
    };
}

declare interface KubeMetadata {
    readonly name: string;
    readonly namespace: string;
    readonly selfLink: string;
    readonly resourceVersion: string;

    readonly labels: any;
    readonly annotations: any;
}

declare interface KubeItem {
    readonly metadata: KubeMetadata;
    readonly spec: {
        rules: any[];
        tls: any[];
    },
    readonly status: any;
}
