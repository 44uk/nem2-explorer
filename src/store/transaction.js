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

import Vue from 'vue'
import * as nem from 'nem2-sdk'
import format from '../format'
import util from './util'
import sdkTransaction from '../infrastructure/getTransaction'

// TODO(ahuszagh) Remove
//const REGISTER_NAMESPACE_TRANSACTION = new nem.NamespaceRegistrationTransaction(
//  nem.NetworkType.MIJIN_TEST,
//  0x01,
//  nem.Deadline.createFromDTO([1, 0]),
//  new nem.UInt64([0, 0]),
//  nem.NamespaceRegistrationType.RootNamespace,
//  'cat',
//  nem.NamespaceId.createFromEncoded('B1497F5FBA651B4F'),
//  new nem.UInt64([0, 0]),
//  undefined,
//  '02E8B286E73B915AE95D9FB94E4EE4EED8FF9C83CE9114A72174C7A7EB95C4DD05E72EA31E01725219E713D2EDDF2F57AEC7125C21B7AD1F297D5E1FE316EC0B',
//  nem.PublicAccount.createFromPublicKey(
//    '50B14146D48F931788F3ADAEE6B5C05CF2A09B75FB3FC2ACF8E9C95AF1393024',
//    nem.NetworkType.MIJIN_TEST
//  ),
//  new nem.TransactionInfo(
//    new nem.UInt64([1, 0]),
//    0,
//    '5D7FA14E02F1E60001529B04',
//    '979ACF8EB76B756B8B465F0F09D72777931260E20810E51F211B3CA61CFB4CE6',
//    '979ACF8EB76B756B8B465F0F09D72777931260E20810E51F211B3CA61CFB4CE6'
//  )
//)
//
//const TRANSFER_TRANSACTION = new nem.TransferTransaction(
//  nem.NetworkType.MIJIN_TEST,
//  0x01,
//  nem.Deadline.createFromDTO([1, 0]),
//  new nem.UInt64([0, 0]),
//  nem.Address.createFromEncoded('907201499665FB8835086760365556EA5BC0553921B89BD48D'),
//  [
//    new nem.Mosaic(new nem.MosaicId('85BBEA6CC462B244'), nem.UInt64.fromUint(449949999900000)),
//    new nem.Mosaic(new nem.MosaicId('941299B2B7E1291C'), nem.UInt64.fromUint(3750000))
//  ],
//  nem.PlainMessage.create('Hello World!'),
//  '4E7129E03791F5D38483E64B0BB327BF6BE40C4DC63315AFB486789BF0BEA2DD0AE34D2AAFD1B3EF275B7EA338F19AFE60BE194366213D8CEC6509798FB55609',
//  nem.PublicAccount.createFromPublicKey(
//    '50B14146D48F931788F3ADAEE6B5C05CF2A09B75FB3FC2ACF8E9C95AF1393024',
//    nem.NetworkType.MIJIN_TEST
//  ),
//  new nem.TransactionInfo(
//    new nem.UInt64([1, 0]),
//    0,
//    '5D7FA14E02F1E60001529B07',
//    '90F1F645D6AEA45D750BA1ECFEF686619C7C149C9B8096D3D34C2F3346372E8E',
//    '90F1F645D6AEA45D750BA1ECFEF686619C7C149C9B8096D3D34C2F3346372E8E'
//  )
//)
//
//const TRANSACTION_LIST = [
//  REGISTER_NAMESPACE_TRANSACTION,
//  TRANSFER_TRANSACTION
//]
//
//const getTransactionsWithLimit = async (pageSize) => {
//  return format.formatTransactions(TRANSACTION_LIST)
//}
//
//const getTransactionsSinceHashWithLimit = async (pageSize, hash) => {
//  return format.formatTransactions(TRANSACTION_LIST)
//}
//
//const getTransactionsMaxHashWithLimit = async (pageSize, hash) => {
//  return format.formatTransactions(TRANSACTION_LIST)
//}

const PAGE_DEFAULT = {
  // Holds the PAGE_SIZE transactions starting from current page.
  pageList: [],
  // The current page index (0-indexed).
  pageIndex: 0,
}

const PAGES = {
  // Recent block pages.
  recent: { ...PAGE_DEFAULT },
  // Pending block pages.
  pending: { ...PAGE_DEFAULT },
  // Transfer block pages.
  transfer: { ...PAGE_DEFAULT },
  // Multisig block pages.
  multisig: { ...PAGE_DEFAULT },
  // Mosaic block pages.
  mosaic: { ...PAGE_DEFAULT },
}

// Map the page name to the transaction type.
const TRANSACTION_TYPE_MAP = {
  recent: undefined,
  pending: 'unconfirmed',
  transfer: 'transfer',
  multisig: undefined,    // TODO(ahuszagh) Not correct
  mosaic: undefined,      // TODO(ahuszagh) Not correct
}

export default {
  namespaced: true,
  state: {
    // Holds the latest PAGE_SIZE transactions.
    latestList: [],
    // The current transaction type key, as defined in `PAGES`.
    transactionType: 'recent',
    ...PAGES,
    // Subscription to new transactions.
    subscription: null,
    // Determine if the transactions model is loading.
    loading: false,
    // TransactionInfo by hash.
    transactionInfo: {},
    // Transaction Body Info.
    transactionDetail: {},
    transactionInfoLoading: false
  },
  getters: {
    getLatestList: state => state.latestList,
    getRecentList: state => Array.prototype.filter.call(state.latestList, (item, index) => {
      return index < 4
    }),
    getTransactionType: state => state.transactionType,
    getPageList: state => state[state.transactionType].pageList,
    getPageIndex: state => state[state.transactionType].pageIndex,
    getPageListFormatted: (state, getters) => getters.getPageList.map(el => ({
      // TODO(ahuszagh) Likely need to rework this.
      deadline: el.deadline,
      blockHeight: el.blockHeight,
      transactionId: el.transactionId,
      transactionHash: el.transactionHash,
      fee: el.fee
    })),
    getSubscription: state => state.subscription,
    getLoading: state => state.loading,
    transactionInfo: state => state.transactionInfo,
    transactionDetail: state => state.transactionDetail,
    transferMosaics: state => state.transferMosaics,
    aggregateInnerTransactions: state => state.aggregateInnerTransactions,
    aggregateCosignatures: state => state.aggregateCosignatures,
    transactionInfoLoading: state => state.transactionInfoLoading
  },
  mutations: {
    setLatestList: (state, list) => { state.latestList = list },
    setTransactionType: (state, transactionType) => { state.transactionType = transactionType },
    setPageList: (state, list) => { state[state.transactionType].pageList = list },
    setPageListWithType: (state, { list, type }) => { state[type].pageList = list },
    setPageIndex: (state, pageIndex) => { state[state.transactionType].pageIndex = pageIndex },
    setSubscription: (state, subscription) => { state.subscription = subscription },
    setLoading: (state, loading) => { state.loading = loading },
    // TODO(ahuszagh) Likely need to rework this.
    // This isn't great.
    resetPageIndex: (state) => { state[state.transactionType].pageIndex = 0 },
    addLatestItem(state, item) {
      // TODO(ahuszagh) Actually implement...
      //util.addLatestItemByKey(state, item, 'hash', 1)
    },

    // TODO(ahuszagh) Bad names....
    transactionInfo: (state, transactionInfo) => Vue.set(state, 'transactionInfo', transactionInfo),
    transactionDetail: (state, transactionDetail) => Vue.set(state, 'transactionDetail', transactionDetail),
    transferMosaics: (state, transferMosaics) => Vue.set(state, 'transferMosaics', transferMosaics),
    aggregateInnerTransactions: (state, aggregateInnerTransactions) => Vue.set(state, 'aggregateInnerTransactions', aggregateInnerTransactions),
    aggregateCosignatures: (state, aggregateCosignatures) => Vue.set(state, 'aggregateCosignatures', aggregateCosignatures),
    transactionInfoLoading: (state, v) => state.transactionInfoLoading = v,
  },
  actions: {
    // Initialize the transaction model.
    // First fetch the page, then subscribe.
    async initialize({ dispatch }) {
      await dispatch('initializePage')
      await dispatch('subscribe')
    },

    // Uninitialize the transaction model.
    uninitialize({ dispatch }) {
      dispatch('unsubscribe')
    },

    // Subscribe to the latest transactions.
    async subscribe({ commit, dispatch, getters }) {
      // TODO(ahuszagh) Implement...
    },

    // Unsubscribe from the latest transactions.
    unsubscribe({ commit, getters }) {
      let subscription = getters.getSubscription
      if (subscription !== null) {
        subscription[1].unsubscribe()
        subscription[0].close()
        commit('setSubscription', null)
      }
    },

    // Add block to latest transactions.
    add({ commit }, item) {
      // TODO(ahuszagh) Also need to rework this.
      // Need to consider transaction type.
//      commit('chain/setTransactionHash', item.transactionHash, { root: true })
//      commit('addLatestItem', item)
    },

    // Fetch data from the SDK and initialize the page.
    async initializePage({ commit }) {
      commit('setLoading', true)
      for (var transactionType of Object.keys(PAGES)) {
        const type = TRANSACTION_TYPE_MAP[transactionType]
        let transactionList = await sdkTransaction.getTransactionsFromHashWithLimit(util.PAGE_SIZE, type)
        commit('setPageListWithType', { list: transactionList, type: transactionType})
      }
      commit('setLoading', false)
    },

    // Fetch the next page of data.
    async fetchNextPage({ commit, getters }) {
      // TODO(ahuszagh) Also need to rework this.
      // Need to consider transaction type.
      commit('setLoading', true)
//      const pageList = getters.getPageList
//      const pageIndex = getters.getPageIndex
//      if (pageList.length > 0) {
//        // Page is loaded, need to fetch next page.
//        const index = pageList.length - 1
//        const earliestTransaction = pageList[index]
//        const maxTransactionHash = earliestTransaction.transactionHash
//        let transactionList = await getTransactionsMaxHashWithLimit(util.PAGE_SIZE, maxTransactionHash)
//        commit('setPageIndex', pageIndex + 1)
//        commit('setPageList', transactionList)
//      }
      commit('setLoading', false)
    },

    // Fetch the previous page of data.
    async fetchPreviousPage({ commit, getters }) {
      // TODO(ahuszagh) Also need to rework this.
      // Need to consider transaction type.
      commit('setLoading', true)
//      const pageList = getters.getPageList
//      const pageIndex = getters.getPageIndex
//      if (pageIndex === 1) {
//        // Can specialize for the latest list.
//        commit('setPageList', getters.getLatestList)
//        commit('setPageIndex', 0)
//      } else if (pageIndex > 0 && pageList.length > 0) {
//        // Page is loaded, need to fetch previous page.
//        const latestTransaction = pageList[0]
//        const sinceTransactionHash = latestTransaction.transactionHash
//        let transactionList = await getTransactionsSinceHashWithLimit(util.PAGE_SIZE, sinceTransactionHash)
//        commit('setPageList', transactionList)
//        commit('setPageIndex', pageIndex - 1)
//      }
      commit('setLoading', false)
    },

    // Change the current page.
    changePage({ commit, getters }) {
      // TODO(ahuszagh) Implement....
    },

    // Reset the current page type and page index.
    // TODO(ahuszagh) Maybe need a helper
    resetPage({ commit, getters }) {
      commit('setLoading', true)
      if (getters.getTransactionType !== 'recent') {
        // Reset data if we're not on recent.
        // TODO(ahuszagh) Need to set to the first page.
        //commit('resetPageIndex')
        //commit('setPageList', [])
      }

      commit('setTransactionType', 'recent')
      if (getters.getPageIndex > 0) {
        // TODO(ahuszagh) This should never run, honestly.
        commit('setPageList', getters.getLatestList)
        commit('resetPageIndex')
      }
      commit('setLoading', false)
    },

    async getTransactionInfoByHash({ commit }, hash) {
      commit('transactionInfoLoading', true)
      commit('transactionInfoError', false)
      commit('transactionInfo', {})
      commit('transactionDetail', {})
      commit('transferMosaics', [])
      commit('aggregateInnerTransactions', [])
      commit('aggregateCosignatures', [])

      let transactionInfo
      try {
        transactionInfo = await sdkTransaction.getTransactionInfoByHash(hash)
      } catch (e) {
        console.error(e)
        commit('transactionInfoError', true)
      }

      if (transactionInfo) {
        let formattedTransactionInfo = {
          blockHeight: transactionInfo.transaction.blockHeight,
          transactionHash: transactionInfo.transaction.transactionHash,
          transactionId: transactionInfo.transaction.transactionId,
          date: transactionInfo.timestamp,
          deadline: transactionInfo.transaction.deadline,
          fee: transactionInfo.transaction.fee,
          signature: transactionInfo.transaction.signature,
          signer: transactionInfo.transaction.signer,
          status: transactionInfo.status,
          confirm: transactionInfo.confirm
        }

        commit('transactionInfo', formattedTransactionInfo)

        let transactionBody = transactionInfo.transaction.transactionBody
        let formattedTransactionDetail = {}
        let formattedTransferMosaics = []
        let formattedAggregateInnerTransactions = []
        let formattedAggregateCosignatures = []

        // Reset to Empty Array
        commit('transferMosaics', formattedTransferMosaics)
        commit('aggregateInnerTransactions', formattedAggregateInnerTransactions)
        commit('aggregateCosignatures', formattedAggregateCosignatures)

        switch (transactionBody.typeId) {
          case nem.TransactionType.TRANSFER:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              recipient: transactionBody.recipient,
              message: transactionBody.message
            }

            formattedTransferMosaics = transactionBody.mosaics.map((el) => ({
              mosaicId: el.id,
              amount: el.amount
            }))

            commit('transferMosaics', formattedTransferMosaics)
            break

          case nem.TransactionType.REGISTER_NAMESPACE:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              registrationType: transactionBody.registrationType,
              namespaceName: transactionBody.namespaceName,
              namespaceId: transactionBody.namespaceId,
              parentId: transactionBody.parentId,
              duration: transactionBody.duration
            }
            break

          case nem.TransactionType.ADDRESS_ALIAS:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              aliasAction: transactionBody.aliasAction,
              namespaceId: transactionBody.namespaceId
            }
            break

          case nem.TransactionType.MOSAIC_ALIAS:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              aliasAction: transactionBody.aliasAction,
              namespaceId: transactionBody.namespaceId,
              mosaicId: transactionBody.mosaicId
            }
            break

          case nem.TransactionType.MOSAIC_DEFINITION:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              mosaicId: transactionBody.mosaicId,
              divisibility: transactionBody.divisibility,
              duration: transactionBody.duration,
              nonce: transactionBody.nonce,
              supplyMutable: transactionBody.supplyMutable,
              transferable: transactionBody.transferable,
              restrictable: transactionBody.restrictable
            }
            break

          case nem.TransactionType.MOSAIC_SUPPLY_CHANGE:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              mosaicId: transactionBody.mosaicId,
              direction: transactionBody.direction,
              delta: transactionBody.delta
            }
            break

          case nem.TransactionType.MODIFY_MULTISIG_ACCOUNT:
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }
            break

          case nem.TransactionType.AGGREGATE_COMPLETE:
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }

            formattedAggregateInnerTransactions = transactionBody.innerTransactions.map((el) => ({
              transactionId: el.transactionId,
              type: el.transactionBody.type,
              signer: el.signer,
              recipient: el.transactionBody.recipient
            }))

            commit('aggregateInnerTransactions', formattedAggregateInnerTransactions)

            formattedAggregateCosignatures = transactionBody.cosignatures.map((el) => ({
              signature: el.signature,
              signer: el.signer
            }))

            commit('aggregateCosignatures', formattedAggregateCosignatures)
            break

          case nem.TransactionType.AGGREGATE_BONDED:
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }

            formattedAggregateInnerTransactions = transactionBody.innerTransactions.map((el) => ({
              transactionId: el.transactionId,
              type: el.transactionBody.type,
              signer: el.signer,
              recipient: el.transactionBody.recipient
            }))

            commit('aggregateInnerTransactions', formattedAggregateInnerTransactions)

            formattedAggregateCosignatures = transactionBody.cosignatures.map((el) => ({
              signature: el.signature,
              signer: el.signer
            }))

            commit('aggregateCosignatures', formattedAggregateCosignatures)
            break

          case nem.TransactionType.LOCK:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              duration: transactionBody.duration,
              mosaicId: transactionBody.mosaicId,
              amount: transactionBody.amount
            }
            break

          case nem.TransactionType.SECRET_LOCK:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              duration: transactionBody.duration,
              mosaicId: transactionBody.mosaicId,
              secret: transactionBody.secret,
              recipient: transactionBody.recipient,
              hashType: transactionBody.hashType
            }
            break

          case nem.TransactionType.SECRET_PROOF:
            // Todo: Anthony
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }
            break

          case nem.TransactionType.MODIFY_ACCOUNT_PROPERTY_ADDRESS:
            // Todo: Anthony
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }
            break

          case nem.TransactionType.MODIFY_ACCOUNT_PROPERTY_MOSAIC:
            // Todo: Anthony
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }
            break

          case nem.TransactionType.MODIFY_ACCOUNT_PROPERTY_ENTITY_TYPE:
            // Todo: Anthony
            formattedTransactionDetail = {
              transactionType: transactionBody.type
            }
            break

          case nem.TransactionType.LINK_ACCOUNT:
            formattedTransactionDetail = {
              transactionType: transactionBody.type,
              linkAction: transactionBody.linkAction,
              remoteAccountPublicKey: transactionBody.remoteAccountPublicKey,
              remoteAccountAddress: transactionBody.remoteAccountAddress
            }
            break

          default:
            break
        }

        commit('transactionDetail', formattedTransactionDetail)
      }

      commit('transactionInfoLoading', false)
    }
  }
}
