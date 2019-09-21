/*
 *
 * Copyright (c) 2019-present for NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License ");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

export default {
  namespaced: true,
  state: {
    // The current block height.
    blockHeight: 0,
    // The latest transaction hash.
    transactionHash: ''
  },
  getters: {
    getBlockHeight(state) {
      return state.blockHeight
    },
    getTransactionHash(state) {
      return state.transactionHash
    }
  },
  mutations: {
    setBlockHeight(state, blockHeight) {
      state.blockHeight = blockHeight
    },
    setTransactionHash(state, transactionHash) {
      state.transactionHash = transactionHash
    }
  }
}