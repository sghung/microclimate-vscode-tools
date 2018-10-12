import * as vscode from "vscode";

import newConnectionCmd from "./NewConnectionCmd";
import goToFolder from "./GoToFolderCmd";
import restartProjectCmd from "./RestartProjectCmd";
import openInBrowserCmd from "./OpenInBrowserCmd";
import Project from "../microclimate/project/Project";
import Connection from "../microclimate/connection/Connection";
import ConnectionManager from "../microclimate/connection/ConnectionManager";
import requestBuildCmd from "./RequestBuildCmd";
import openBuildLogCmd from "./OpenBuildLogCmd";
import openAppLogCmd from "./OpenAppLogCmd";
import { start } from "repl";
import { ProjectState } from "../microclimate/project/ProjectState";
import { pseudoRandomBytes } from "crypto";

export function createCommands() {

    return [
        vscode.commands.registerCommand("ext.mc.newConnection", () => newConnectionCmd()),
        vscode.commands.registerCommand("ext.mc.goToFolder", (args) => goToFolder(args)),

        vscode.commands.registerCommand("ext.mc.restartProjectRun", (args) => restartProjectCmd(args, false)),
        vscode.commands.registerCommand("ext.mc.restartProjectDebug", (args) => restartProjectCmd(args, true)),

        vscode.commands.registerCommand("ext.mc.openInBrowser", (args) => openInBrowserCmd(args)),
        vscode.commands.registerCommand("ext.mc.requestBuild", (args) => requestBuildCmd(args)),

        vscode.commands.registerCommand("ext.mc.openBuildLog", (args) => openBuildLogCmd(args)),
        vscode.commands.registerCommand("ext.mc.openAppLog", (args) => openAppLogCmd(args))

    ];
}

// Some commands require a project or connection to be selected,
// if they're launched from the command pallet we have to
// ask which resource they want to run the command on.
// only return projects that are in an 'acceptableState'
export async function promptForProject(...acceptableStates: ProjectState.AppStates[]): Promise<Project | undefined> {
    const project = await promptForResourceInner(false, ...acceptableStates);
    if (project instanceof Project) {
        return project as Project;
    }
    else if (project instanceof Connection) {
        // should never happen
        console.error("promptForProject received Connection back");
    }

    // user cancelled, or error above
    return undefined;
}

export async function promptForResource(...acceptableStates: ProjectState.AppStates[]): Promise<Project | Connection | undefined> {
    return promptForResourceInner(true, ...acceptableStates);
}

async function promptForResourceInner(includeConnections: Boolean, ...acceptableStates: ProjectState.AppStates[]):
        Promise<Project | Connection | undefined> {

    // TODO Try to get the name of †he selected project, and have it selected initially
    const choices: vscode.QuickPickItem[] = [];

    const connections = ConnectionManager.instance.connections;
    if (includeConnections) {
        // Convert each Connection into a QuickPickItem
        choices.push(...connections);
    }

    // for now, assume if they want Started, they also accept Debugging. This may change.
    if (acceptableStates.indexOf(ProjectState.AppStates.STARTED) !== -1
            && acceptableStates.indexOf(ProjectState.AppStates.DEBUGGING) === -1) {

        acceptableStates.push(ProjectState.AppStates.DEBUGGING);
    }
    console.log("Accept states", acceptableStates, "test", acceptableStates.indexOf(ProjectState.AppStates.STARTED));

    await new Promise<void>( async (resolve, _) => {
        for (const conn of connections) {
            let projects = await conn.getProjects();
            console.log("projects before", projects);
            if (acceptableStates.length > 0) {
                // Filter out projects that are not in one of the acceptable states
                projects = projects.filter( (p) => {
                    const index = acceptableStates.indexOf(p.state.appState);
                    console.log("the index of ", p.state.appState, " in ", acceptableStates, " is ", index);
                    return index !== -1;
                });
            }
            console.log("projects after", projects);
            choices.push(...projects);
        }
        return resolve();
    });

    // If no choices are available, show a message
    if (choices.length === 0) {
        let requiredStatesStr: string = "";

        if (acceptableStates.length !== 0) {
            requiredStatesStr += acceptableStates.map( (state) => state.toString()).join(", ");
        }

        // TODO improve the msg.
        const msg = `There is no ${includeConnections ? " Connection, or" : ""} ${requiredStatesStr} Project ` +
                `on which to run this command.`;
        vscode.window.showWarningMessage(msg, /*{ modal: true }*/);
        return undefined;
    }

    const selection = await vscode.window.showQuickPick(choices, { canPickMany: false, ignoreFocusOut: choices.length !== 0 });
    if (selection == null) {
        // user cancelled
        return undefined;
    }
    else if (selection instanceof Project) {
        return selection as Project;
    }
    else if (selection instanceof Connection) {
        return selection as Connection;
    }
    else {
        console.error(`Unsupported type in promptForResource ${typeof(selection)}`);
        return undefined;
    }
}