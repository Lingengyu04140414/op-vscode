import { Item, item } from "@1password/op-js";
import { default as open } from "open";
import { commands, env, Uri, UriHandler } from "vscode";
import { COMMANDS, QUALIFIED_EXTENSION_ID } from "./constants";
import { Core } from "./core";
import { logger } from "./logger";

// Extension-level URL handler
// e.g. vscode://1Password.op-vscode?command=view-item&vault=...&item=...

export enum UriCommand {
	ViewItem = "view-item",
}

export const createOpvsUrl = (
	command: UriCommand,
	queryParams: Record<string, string> = {},
) =>
	Uri.from({
		scheme: env.uriScheme,
		authority: QUALIFIED_EXTENSION_ID,
		query: new URLSearchParams({ command, ...queryParams }).toString(),
	});

export class OpvsUriHandler implements UriHandler {
	public async handleUri(uri: Uri): Promise<void> {
		const params = new URLSearchParams(uri.query);
		const command = params.get("command") as UriCommand;

		switch (command) {
			case UriCommand.ViewItem:
				await commands.executeCommand(COMMANDS.OPEN_1PASSWORD, {
					action: OPHAction.ViewItem,
					vault: params.get("vault"),
					item: params.get("item"),
				});
				break;
		}
	}
}

// Utilities for interacting with OPH

export enum OPHAction {
	ViewItem = "view-item",
}

export const createOpenOPHandler =
	(core: InstanceType<typeof Core>) =>
	// eslint-disable-next-line unicorn/no-object-as-default-parameter
	async ({ action, ...args }: { action: OPHAction | "" } = { action: "" }) => {
		const url = new URL(`onepassword://${action}`);

		switch (action) {
			case OPHAction.ViewItem:
				const { vault, item: itemValue } = args as {
					vault: string;
					item: string;
				};

				const vaultItem = await core.cli.execute<Item>(() =>
					item.get(itemValue, { vault }),
				);

				url.searchParams.append("a", core.accountUuid);
				url.searchParams.append("v", vaultItem.vault.id);
				url.searchParams.append("i", vaultItem.id);
				break;
		}

		logger.logDebug(`Opening 1Password with path: ${action}`);

		await open(url.href);
	};
