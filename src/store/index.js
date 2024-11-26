import { createStore } from 'vuex';

export default createStore({
  state: {
    files: [],
    selectedFile: null,
  },
  mutations: {
    SET_FILES(state, files) {
      state.files = files;
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file;
    },
    ADD_FILE(state, file) {
      state.files.unshift(file);
    },
    REMOVE_FILE(state, fileId) {
      const index = state.files.findIndex(f => f.id === fileId);
      if (index !== -1) {
        state.files.splice(index, 1);
      }
    },
  },
  actions: {
    loadHistory({ commit }) {
      const history = localStorage.getItem("excelReaderHistory");
      if (history) {
        const files = JSON.parse(history);
        commit('SET_FILES', files);
        if (files.length > 0) {
          commit('SET_SELECTED_FILE', files[0]);
        }
      }
    },
    saveHistory({ state }) {
      localStorage.setItem("excelReaderHistory", JSON.stringify(state.files));
    },
    selectFile({ commit }, file) {
      commit('SET_SELECTED_FILE', file);
    },
    addFile({ commit, dispatch }, file) {
      commit('ADD_FILE', file);
      commit('SET_SELECTED_FILE', file);
      dispatch('saveHistory');
    },
    deleteFile({ commit, state, dispatch }, fileId) {
      const index = state.files.findIndex(f => f.id === fileId);
      commit('REMOVE_FILE', fileId);
      
      if (state.selectedFile && state.selectedFile.id === fileId) {
        if (state.files.length > 0) {
          commit('SET_SELECTED_FILE', state.files[0]);
        } else {
          commit('SET_SELECTED_FILE', null);
        }
      }
      
      dispatch('saveHistory');
    },
  },
});
