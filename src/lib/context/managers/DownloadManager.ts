import { EventLink } from '../../shared/services/EventLink';
import { TFileOrFolder } from '../../types/TFileOrFolder';


export class DownloadManager {


  /**
   * Triggers the download of a single file with specific content.
   * @param fileName The name of the file to be generated.
   * @param fileType The extension/type of the file.
   * @param fileContent The string content to be written to the file.
   */
  public async downloadFile(fileName: string, fileType: string, fileContent: string): Promise<void> {
    return await EventLink.sendEvent<string, void>('download:file', fileName, fileType, fileContent);
  }

  /**
   * Triggers the download of multiple files and folders compressed into a ZIP archive.
   * @param downloadName The name of the resulting ZIP file.
   * @param files An array of file or folder objects to be included in the download.
   */
  public async downloadFiles(downloadName: string, files: TFileOrFolder[]): Promise<void> {
    return await EventLink.sendEvent<string | TFileOrFolder[], void>('download:files', downloadName, files);
  }
}
