import { Command, ThemeIcon, TreeItem } from "vscode";

export class DockerContainer extends TreeItem {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly image: string,
        public readonly iconPath: ThemeIcon ,

        public readonly description: string

        ) {
           
            super(`${image}`);

    }
}
