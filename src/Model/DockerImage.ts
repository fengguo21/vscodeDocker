import { Command, ThemeIcon, TreeItem } from "vscode";

export class DockerImage extends TreeItem {
    constructor(
        public readonly id: string,
        public readonly repository: string,

        public readonly iconPath: ThemeIcon,
       ) {
        super(`${repository}`);
    }
}
