import * as path from "path";
import * as vscode from "vscode";
import { ThemeIcon, ThemeColor } from "vscode";
import { AppInsightsClient } from "./appInsightsClient";
import { DockerTreeBase } from "./dockerTreeBase";
import { Executor } from "./executor";
import { DockerContainer } from "./Model/DockerContainer";
import { Utility } from "./utility";
import { DockerImage } from "./Model/DockerImage";

const Docker = require("dockerode");
const dockerClient= new Docker({
  host: "43.133.60.195",
 
  
  port: process.env.DOCKER_PORT || 2375,
  // host: "127.0.0.1",
  // port:3000,

  version: "v1.25", // required when D
});
export class DockerContainers
  extends DockerTreeBase<DockerContainer>
  implements vscode.TreeDataProvider<DockerContainer>
{
  private cachedContainerStrings = [];

  constructor(context: vscode.ExtensionContext) {
    

    super(context);
    
  }

  public searchContainer(): void {
    AppInsightsClient.sendEvent("searchContainer");
    const interval = Utility.getConfiguration().get<number>(
      "autoRefreshInterval"
    );
    let containerStrings = [];
    if (interval > 0 && this.cachedContainerStrings.length > 0) {
      this.cachedContainerStrings.forEach((containerString) => {
        const items = containerString.split(" ");
        containerStrings.push(`${items[1]} (${items[2]})`);
      });
    } else {
      containerStrings = Executor.execSync(
        'docker ps -a --format "{{.Names}} ({{.Image}})"'
      )
        .split(/[\r\n]+/g)
        .filter((item) => item);
    }

    vscode.window
      .showQuickPick(containerStrings, {
        placeHolder: "Search Docker Container",
      })
      .then((containerString) => {
        if (containerString !== undefined) {
          const items = containerString.split(" ");
          this.getContainer(items[0]);
        }
      });
  }

  public getTreeItem(element: DockerContainer): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: DockerContainer): Promise<DockerContainer[]>{
   
    const  containers = await dockerClient.listContainers( { all: true })
    console.log(containers,'containers')
    let tmp = []
     containers.forEach(item =>{
      console.log(item,'item')

      const icon = item.State === 'running' ? new ThemeIcon('notebook-execute',new ThemeColor('list.focusHighlightForeground')) : new ThemeIcon('notebook-stop',new ThemeColor('list.errorForeground'))
      // const icon = new vscode.T('info')//  this.context.asAbsolutePath(path.join("resources", img));
      // const icon =  new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'))
     tmp.push( new DockerContainer(item.Id,item.Names[0],item.Image,icon ,item.Names[0]+'  ' + item.Status))
     })  
    return tmp
  }
//  setTimeout(() => {
//         console.log(containers, "containers222");
//         return Promise.resolve(containers);
//       }, 1000);
    // console.log(containers, "containers000001111");
    // return Promise.resolve([]);

   
    // return Promise.resolve(containers);
    // const containers = [];
    // try {
    //     this.cachedContainerStrings = this.getContainerStrings();
    //     this.cachedContainerStrings.forEach((containerString) => {
    //         const items = containerString.split(" ");
    //         const image = items[3] === "Up" ? "container-on.png" : "container-off.png";
    //         containers.push(new DockerContainer(
    //             items[0],
    //             items[1],
    //             items[2],
    //             this.context.asAbsolutePath(path.join("resources", image)),
    //             {
    //                 command: "docker-explorer.getContainer",
    //                 title: "",
    //                 arguments: [items[1]],
    //             },
    //         ));
    //     });
    // } catch (error) {
    //     if (!DockerTreeBase.isErrorMessageShown) {
    //         vscode.window.showErrorMessage(`[Failed to list Docker Containers] ${error.stderr}`);
    //         DockerTreeBase.isErrorMessageShown = true;
    //     }
    // } finally {
    //     this.setAutoRefresh(this.cachedContainerStrings, this.getContainerStrings);
    // }

    // return Promise.resolve([new DockerContainer('dfd','d','d','d',null)]);


  public getContainer(containerName: string): void {
    Executor.runInTerminal(`docker ps -a --filter "name=${containerName}"`);
    AppInsightsClient.sendEvent("getContainer");
  }

  public startContainer(containerName: string): void {
    var container = dockerClient.getContainer(containerName);
    console.log(container,'container getcontaiern===')
    container.start(function (err:any, data:any) {
      // if(data){
      //   this.getChildren()
      // }
      console.log(err,data);
    });
    // let res = container.start();
    // console.log(res,'res')
    // Executor.runInTerminal(`docker start ${containerName}`);
    // AppInsightsClient.sendEvent("startContainer");
  }

  public attachContainer(containerName: string): void {
    Executor.runInTerminal(
      `docker attach ${containerName}`,
      true,
      `attach ${containerName}`
    );
    AppInsightsClient.sendEvent("attachContainer");
  }

  public stopContainer(containerName: string): void {

    var container = dockerClient.getContainer(containerName);
    console.log(container,'container getcontaiern===')
    container.stop(function (err:any, data:any) {
      if(data){
        this.getChildren()
      }
      console.log(err,data);
    });

    // Executor.runInTerminal(`docker stop ${containerName}`);
    // AppInsightsClient.sendEvent("stopContainer");
  }

  public restartContainer(containerName: string): void {
    Executor.runInTerminal(`docker restart ${containerName}`);
    AppInsightsClient.sendEvent("restartContainer");
  }

  public showContainerStatistics(containerName: string): void {
    Executor.runInTerminal(`docker stats ${containerName}`);
    AppInsightsClient.sendEvent("showContainerStatistics");
  }

  public showContainerLogs(containerName: string): void {
    const containerLogsOptions = Utility.getConfiguration().get<string>(
      "containerLogsOptions"
    );
    Executor.runInTerminal(
      `docker logs ${containerName} ${containerLogsOptions}`,
      true,
      `logs ${containerName}`
    );
    AppInsightsClient.sendEvent("showContainerLogs");
  }

  public inspectContainer(containerName: string): void {
    Executor.runInTerminal(`docker inspect ${containerName}`);
    AppInsightsClient.sendEvent("inspectContainer");
  }

  public removeContainer(containerName: string): void {
    Executor.runInTerminal(`docker rm ${containerName}`);
    AppInsightsClient.sendEvent("removeContainer");
  }

  public executeCommandInContainer(containerName: string): void {
    const command = Utility.getConfiguration().get<string>("executionCommand");
    if (command) {
      Executor.runInTerminal(`docker exec ${containerName} ${command}`);
    } else {
      Executor.runInTerminal(`docker exec ${containerName} `, false);
    }
    AppInsightsClient.sendEvent(
      "executeCommandInContainer",
      command ? { executionCommand: command } : {}
    );
  }

  public executeInBashInContainer(containerName: string): void {
    Executor.runInTerminal(
      `docker exec -it ${containerName} bash`,
      true,
      containerName
    );
    AppInsightsClient.sendEvent("executeInBashInContainer");
  }

  private getContainerStrings(): string[] {
    // var docker3 = new Docker({
    //     host: '43.133.60.195',
    //     port: process.env.DOCKER_PORT || 2375,

    //     version: 'v1.25' // required when D
    // });

    // let containers = []
    // docker3.listContainers(async function (err: any, res: any) {
    //     console.log(containers, 'containers');
    //     await res.forEach(function (containerInfo) {
    //         console.log(containerInfo, 'containerInfo');
    //         containers.push('' + containerInfo.Id + ' ' + containerInfo.Names[0] + ' ' + containerInfo.Image + ' ' + containerInfo.Status)
    //     })
    //     console.log(containers, 'containers00000')
    //     resolve(containers)
    // })

    return Executor.execSync(
      'docker ps -a --format "{{.ID}} {{.Names}} {{.Image}} {{.Status}}"'
    )
      .split(/[\r\n]+/g)
      .filter((item) => item);
  }
}
