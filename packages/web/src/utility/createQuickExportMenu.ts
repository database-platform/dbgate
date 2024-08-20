import type { QuickExportDefinition } from 'dbgate-types';
import { getCurrentArchive, getExtensions } from '../stores';

export function createQuickExportMenuItems(handler: (fmt: QuickExportDefinition) => Function, advancedExportMenuItem) {
  const extensions = getExtensions();
  return [
    ...extensions.quickExports.map(fmt => ({
      text: fmt.label,
      onClick: handler(fmt),
    })),
    { divider: true },
    {
      text: 'Current archive',
      onClick: handler({
        extension: 'jsonl',
        label: 'Current archive',
        noFilenameDependency: true,
        createWriter: (fileName, dataName) => ({
          functionName: 'archiveWriter',
          props: {
            fileName: dataName,
            folderName: getCurrentArchive(),
          },
        }),
      }),
    },
    { divider: true },
    {
      text: '__contextMenu.common.more',
      ...advancedExportMenuItem,
    },
  ];
}

export default function createQuickExportMenu(
  handler: (fmt: QuickExportDefinition) => Function,
  advancedExportMenuItem
) {
  return {
    text: '__contextMenu.common.export',
    submenu: createQuickExportMenuItems(handler, advancedExportMenuItem),
  };
}
