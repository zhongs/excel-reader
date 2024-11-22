import * as XLSX from 'xlsx';

export const readExcelFile = async (fileName) => {
  try {
    // 构建文件的完整路径
    const filePath = `/excel/${fileName}`;
    
    // 获取文件
    const response = await fetch(filePath);
    const blob = await response.blob();
    
    // 读取文件内容
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return jsonData;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
};

// 读取目录下所有Excel文件
export const readAllExcelFiles = async (fileNames) => {
  try {
    const results = {};
    for (const fileName of fileNames) {
      results[fileName] = await readExcelFile(fileName);
    }
    return results;
  } catch (error) {
    console.error('Error reading Excel files:', error);
    throw error;
  }
};
