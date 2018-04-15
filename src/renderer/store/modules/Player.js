const state = {
  selectedSong: {
    id: null,
    data: null
  },
  player: {
    context: null,
    source: null,
    gainNode: null
  },
  playlist: [],
  isSongPlaying: false,
  isSongRepeat: false,
  isPlaylistRepeat: false,
  isShuffling: false,
  volume: 50,
  playlists: [],
  currentPlaylist: null,
  songs: [],
  contextTime: 0,
  seekTime: 0,
  isContextRunning: false,
  contextState: ''
}

const mutations = {
  SET_PLAYING_SONG (state, newSong) {
    state.selectedSong = newSong
  },
  SET_PLAYER (state, player) {
    state.player = player
  },
  SET_PLAYLIST (state, playlist) {
    state.playlists = playlist
  },
  SET_SONGS (state, songs) {
    state.songs = []
    songs.forEach(song => {
      state.songs.push(song.dataValues)
    })
  },
  SET_PLAYLISTS (state, playlists) {
    state.playlists = playlists
    console.log(`[Playlists state] Add all playlists to store.`)
  },
  SET_CURRENT_PLAYLIST (state, playlist) {
    state.currentPlaylist = playlist
  },
  SET_CONTEXT_TIME (state, contextTime) {
    state.contextTime = contextTime
  },
  SET_SEEK_TIME (state, seekTime) {
    state.seekTime = seekTime
  },
  SET_VOLUME (state, volume) {
    state.volume = volume
  },
  SET_PLAYER_VOLUME (state, volume) {
    state.player.gainNode.gain.value = volume
  },
  CREATE_PLAYER (state) {
    let audioContext = new AudioContext()
    state.player.context = audioContext
    state.player.source = audioContext.createBufferSource()
    state.player.gainNode = audioContext.createGain()
    state.player.source.connect(state.player.gainNode)
    state.player.gainNode.connect(state.player.context.destination)
    state.isSongPlaying = true
    console.log(`(CREATED) [Player state] ${state.player.context.state}`)
    state.isContextRunning = state.player.context.state === 'running'
  },
  RESUME_PLAYER (state) {
    console.log(`[Player state] Before: ${state.player.context.state}`)
    state.player.context.resume()
    state.isSongPlaying = true
    state.isContextRunning = state.player.context.state === 'running'
    console.log(`[Player state] After: ${state.player.context.state}`)
  },
  SUSPEND_PLAYER (state) {
    console.log(`[Player state] Before: ${state.player.context.state}`)
    state.player.context.suspend()
    state.isSongPlaying = false
    state.isContextRunning = state.player.context.state === 'running'
    console.log(`[Player state] After: ${state.player.context.state}`)
  },
  STOP_PLAYER (state) {
    if (state.player.context && state.player.source) {
      try {
        state.player.source.stop(0)
        state.player.context.close(0)
        state.isSongPlaying = false
        state.isContextRunning = state.player.context.state === 'running'
        console.log(`[Player state] ${state.player.context.state}`)
      } catch (error) {
        console.error(error)
      }
    }
  },
  SET_SELECTED_SONG (state, song) {
    state.selectedSong = {
      id: song.id,
      data: song
    }
  },
  TOGGLE_REPEAT (State) {
    console.log(`Before > Song repeat ${state.isSongRepeat}, Playlist repeat ${state.isPlaylistRepeat}`)
    let isSongRepeat = state.isSongRepeat
    let isPlaylistRepeat = state.isPlaylistRepeat
    state.isSongRepeat = (isPlaylistRepeat) ? isSongRepeat : !isSongRepeat
    state.isPlaylistRepeat = (isSongRepeat || isPlaylistRepeat) ? !isPlaylistRepeat : isSongRepeat
    console.log(`After > Song repeat ${state.isSongRepeat}, Playlist repeat ${state.isPlaylistRepeat}`)
  },
  TOGGLE_SHUFFLE (state) {
    state.isShuffling = !state.isShuffling
    console.log(`Shuffle: ${state.isShuffling ? 'ON' : 'OFF'}`)
  },
  SET_CONTEXT_STATE (state, contextState) {
    console.log(`[Player context state]: ${contextState}`)
    state.contextState = contextState
  }
}

const actions = {
  setContextState ({ commit }, contextState) {
    commit('SET_CONTEXT_STATE', contextState)
  },
  setSongs ({ commit }, songs) {
    commit('SET_SONGS', songs)
  },
  setSeekTime ({ commit }, seekTime) {
    commit('SET_SEEK_TIME', seekTime)
  },
  setContextTime ({ commit }, contextTime) {
    commit('SET_CONTEXT_TIME', contextTime)
  },
  setPlaylists ({ commit }, playlists) {
    commit('SET_PLAYLISTS', playlists)
  },
  setCurrentPlaylist ({ commit }, playlist) {
    commit('SET_CURRENT_PLAYLIST', playlist)
  },
  createPlayer ({ commit, state }) {
    return new Promise((resolve, reject) => {
      commit('CREATE_PLAYER')
      resolve()
    })
  },
  stopPlayer ({ commit }) {
    commit('STOP_PLAYER')
  },
  async playSong ({ dispatch, commit, state }, songInfo) {
    await dispatch('createPlayer')
    state.player.source.buffer = await state.player.context.decodeAudioData(songInfo.bin.buffer)
    await dispatch('setSeekTime', songInfo.seekTime)
    await dispatch('setPlayerVolume', state.volume / 100)
    await new Promise((resolve, reject) => {
      console.log('[Vuex] Successfully decoded. Start playing ...')
      state.player.source.start(0, songInfo.seekTime, state.selectedSong.data.duration)
      state.player.source.onended = function (event) {
        state.player.source.stop(0)
        state.player.context.close()
        console.log('[Context] song ended.')
      }
      resolve()
    })
  },
  setSelectedSong ({ commit }, song) {
    commit('SET_SELECTED_SONG', song)
  },
  resume ({ commit }) {
    commit('RESUME_PLAYER')
  },
  suspend ({ commit }) {
    commit('SUSPEND_PLAYER')
  },
  stopSong ({ commit }) {
    commit('STOP_PLAYER')
  },
  async setVolume ({ dispatch, commit }, volume) {
    await new Promise((resolve, reject) => {
      commit('SET_VOLUME', volume)
      resolve()
    })
    await dispatch('setPlayerVolume', state.volume / 100)
  },
  setPlayerVolume ({ commit }, volume) {
    commit('SET_PLAYER_VOLUME', volume)
  },
  togglePlayerRepeat ({ commit }) {
    commit('TOGGLE_REPEAT')
  },
  toggleShuffle ({ commit }) {
    commit('TOGGLE_SHUFFLE')
  }
}

const getters = {
  getSongs: state => {
    return state.songs
  },
  getContextTime: state => {
    return state.contextTime
  },
  getSeekTime: state => {
    return state.seekTime
  },
  getCurrentTime: state => {
    return state.contextTime + state.seekTime
  },
  getVolume: state => {
    return state.volume
  },
  getPlaylists: state => {
    return state.playlists
  },
  getPlaylistByIndex: state => index => {
    return state.playlists[index]
  },
  getCurrentPlaylist: state => {
    return state.currentPlaylist
  },
  getSongDuration: state => {
    return state.selectedSong.id ? state.selectedSong.data.duration : 0
  },
  getPlayer: state => {
    return state.player
  },
  getSelectedSong: state => {
    // console.table(state.selectedSong)
    return state.selectedSong
  },
  isPlayerRunning: state => {
    console.log(state.player.context ? state.player.context.state === 'running' : false)
    return state.player.context ? state.player.context.state === 'running' : false
  },
  isSongRepeating: state => {
    return state.isSongRepeat
  },
  isPlaylistRepeating: state => {
    return state.isPlaylistRepeat
  },
  getNextSong: state => {
  },
  isPlaylistShuffling: state => {
    return state.isShuffling
  },
  isPlaying: state => {
    return state.isSongPlaying
  },
  getPlayerContextState: state => {
    return state.contextState
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}