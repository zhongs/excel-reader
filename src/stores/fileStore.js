import { defineStore } from 'pinia'

export const useFileStore = defineStore('file', {
  state: () => ({
    files: [],
    selectedFile: null,
  }),

  actions: {
    setFiles(files) {
      this.files = files;
    },

    setSelectedFile(file) {
      this.selectedFile = file;
    },

    addFile(file) {
      this.files.unshift(file);
      this.selectedFile = file;
      this.saveHistory();
    },

    removeFile(fileId) {
      const index = this.files.findIndex(f => f.id === fileId);
      if (index !== -1) {
        this.files.splice(index, 1);
      }
      
      if (this.selectedFile && this.selectedFile.id === fileId) {
        this.selectedFile = this.files.length > 0 ? this.files[0] : null;
      }
      
      this.saveHistory();
    },

    loadHistory() {
      const history = localStorage.getItem("excelReaderHistory");
      if (history) {
        const files = JSON.parse(history);
        this.files = files;
        if (files.length > 0) {
          this.selectedFile = files[0];
        }
      }
    },

    saveHistory() {
      localStorage.setItem("excelReaderHistory", JSON.stringify(this.files));
    },

    selectFile(file) {
      this.selectedFile = file;
    },

    deleteFile(fileId) {
      this.removeFile(fileId);
    }
  }
});
