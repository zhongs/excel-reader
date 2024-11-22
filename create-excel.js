const XLSX = require('xlsx');

// 创建工作簿
const wb = XLSX.utils.book_new();

// 准备数据
const data = [
  ['ID', 'Name', 'Age', 'Email', 'Department'],
  [1, 'John Doe', 30, 'john@example.com', 'Engineering'],
  [2, 'Jane Smith', 28, 'jane@example.com', 'Marketing'],
  [3, 'Bob Wilson', 35, 'bob@example.com', 'Sales'],
  [4, 'Alice Brown', 32, 'alice@example.com', 'HR'],
  [5, 'Charlie Davis', 27, 'charlie@example.com', 'Engineering']
];

// 创建工作表
const ws = XLSX.utils.aoa_to_sheet(data);

// 将工作表添加到工作簿
XLSX.utils.book_append_sheet(wb, ws, 'Users');

// 写入文件
XLSX.writeFile(wb, './public/excel/users.xlsx');
