import {NativeModules} from 'react-native';

interface DocumentPickerResult {
  uri: string;
  fileCopyUri: string;
  name: string;
  size: number;
  type: string;
}

const {DocumentPickerModule} = NativeModules;

class DocumentPicker {
  static async pickPDF(): Promise<DocumentPickerResult> {
    try {
      const result = await DocumentPickerModule.pickPDF();
      return result;
    } catch (error: any) {
      if (error.code === 'CANCELLED') {
        throw new Error('CANCELLED');
      }
      throw error;
    }
  }

  static isCancel(error: any): boolean {
    return error?.message === 'CANCELLED' || error?.code === 'CANCELLED';
  }
}

export default DocumentPicker;
