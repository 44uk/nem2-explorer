import { Address, TransactionType, AliasActionType, UInt64 } from 'nem2-sdk'
import moment from 'moment'
import helper from './helper'

// FORMAT FEE

// Convert micro-xem (smallest unit) to XEM.
const microxemToXem = amount => amount / Math.pow(10, 6)

// Format fee (in microxem) to string (in XEM).
const formatFee = fee => microxemToXem(fee.compact()).toString()

// FORMAT HEIGHT

// Format block/chain height to string.
const formatHeight = height =>
  helper.uint64ToString(height.higher, height.lower)

// FORMAT ADDRESS

// Format address to pretty string.
const formatAddress = address => address.pretty()

// FORMAT TIMESTAMP

// Convert NEM timestamp to date.
const nemstampToDate = nemstamp =>
  new Date(Math.floor(nemstamp.compact() / 1000) + 1459468800)

// Convert date to moment.
const dateToMoment = date => moment(String(date))

// Format timestamp from nemstamp.
const formatTimestamp = nemstamp =>
  dateToMoment(nemstampToDate(nemstamp)).format('YYYY-MM-DD H:mm:ss')

// FORMAT BLOCK

const formatBlocks = (blockList) => {
  if (blockList) {
    return blockList.map(block => {
      return formatBlock(block);
    });
  }
  return;
}

const formatBlock = (block) => {
  let blockObj = {
    height: block.height.compact(),
    hash: block.hash,
    timestamp: block.timestamp.compact() / 1000 + 1459468800,
    date: moment(
      (block.timestamp.compact() / 1000 + 1459468800) * 1000
    ).format('YYYY-MM-DD HH:mm:ss'),
    totalFee: formatFee(block.totalFee),
    difficulty: (block.difficulty.compact() / 1000000000000).toFixed(2),
    numTransactions: block.numTransactions ? block.numTransactions : 0,
    signature: block.signature,
    signer: block.signer,
    previousBlockHash: block.previousBlockHash,
    blockTransactionsHash: block.blockTransactionsHash,
    blockReceiptsHash: block.blockReceiptsHash,
    stateHash: block.stateHash,
  };

  return blockObj;
}

// FORMAT ACCOUNT
const formatAccount = accountInfo => {
  let importanceScore = accountInfo.importance.compact()

  if (importanceScore) {
    importanceScore /= 90000
    importanceScore = importanceScore.toFixed(4).split('.')
    importanceScore = importanceScore[0] + '.' + importanceScore[1]
  }

  const accountObj = {
    meta: accountInfo.meta,
    address: new Address(accountInfo.address.address).pretty(),
    addressHeight: accountInfo.addressHeight.compact(),
    publicKey: accountInfo.publicKey,
    publicKeyHeight: accountInfo.publicKeyHeight.compact(),
    mosaics: formatMosaics(accountInfo.mosaics),
    importance: importanceScore,
    importanceHeight: accountInfo.importanceHeight.compact(),
  }

  return accountObj
}

// FORMAT MOSAICS
const formatMosaics = mosaics => {
  mosaics.map(mosaic => {
    mosaic.id = mosaic.id.toHex()
    mosaic.amount = microxemToXem(mosaic.amount.compact())
  })
  return mosaics
}

// FORMAT TRANSACTIONS
const formatTransactions = transactions => {
  if (transactions) {
    return transactions.map(transaction => {
      return formatTransaction(transaction)
    })
  }
  return
}

// FORMAT TRANSACTION
const formatTransaction = transaction => {
  let transactionObj = {
    deadline: moment(new Date(transaction.deadline.value)).format(
      'YYYY-MM-DD HH:mm:ss'
    ),
    fee: formatFee(transaction.maxFee),
    signature: transaction.signature,
    signer: transaction.signer.address.plain(),
    blockHeight: transaction.transactionInfo.height.compact(),
    transactionHash: transaction.transactionInfo.hash,
    transactionId: transaction.transactionInfo.id,
    transactionBody: formatTransactionBody(transaction),
  }

  return transactionObj
}

// FORMAT TRANSACTION BODY
const formatTransactionBody = transactionBody => {
  console.log(transactionBody)
  switch (transactionBody.type) {
    case TransactionType.TRANSFER:
      let transferObj = {
        type: 'Transfer',
        // typeId: TransactionType.TRANSFER,
        recipient: transactionBody.recipient.address,
        mosaics: formatMosaics(transactionBody.mosaics),
        message: transactionBody.message.payload,
      }
      return transferObj
    case TransactionType.REGISTER_NAMESPACE:
      let parentIdHex = transactionBody.parentId ? transactionBody.parentId.toHex() : '';
      let duration = transactionBody.duration ? transactionBody.duration.compact() : 0;

      let registerNamespaceObj = {
        type: 'RegisterNamespace',
        // typeId: TransactionType.REGISTER_NAMESPACE,
        // recipient: transactionBody.recipient,
        namespaceType: transactionBody.namespaceType === 0 ? 'Root namespace' : 'Child namespace',
        namespaceName: transactionBody.namespaceName,
        namespaceId: transactionBody.namespaceId.toHex(),
        parentId: parentIdHex === '' ? 'NO AVAILABLE' : parentIdHex,
        duration: duration === 0 ? 'unlimited' : duration,
      }
      return registerNamespaceObj
    case TransactionType.ADDRESS_ALIAS:
      let addressAliasObj = {
        type: 'ADDRESS ALIAS',
        recipient: 'NO AVAILABLE',
        // typeId: TransactionType.ADDRESS_ALIAS,
        aliasAction: transactionBody.actionType === 0 ? 'Link' : 'Unlink',
        namespaceId: transactionBody.namespaceId.toHex(),
      };
      return addressAliasObj;

    case TransactionType.MOSAIC_ALIAS:
      let mosaicAlias = {
        type: 'MosaicAlias',
        // typeId: TransactionType.MOSAIC_ALIAS,
        // actionType: transactionBody.actionType,
        aliasAction: transactionBody.actionType === 0 ? 'Link' : 'Unlink',
        namespaceId: transactionBody.namespaceId.id.toHex(),
        mosaicId: transactionBody.mosaicId.id.toHex(),
      }
      return mosaicAlias
    case TransactionType.MOSAIC_DEFINITION:
      let mosaicDefinitionObj = {
        type: 'MosaicDefinition',
        // typeId: TransactionType.MOSAIC_DEFINITION,
        mosaicId: transactionBody.mosaicId.toHex().toLowerCase(),
        divisibility: transactionBody.mosaicProperties.divisibility,
        supplyMutable: transactionBody.mosaicProperties.supplyMutable,
        transferable: transactionBody.mosaicProperties.transferable,
        restrictable: transactionBody.mosaicProperties.restrictable,
      }
      return mosaicDefinitionObj
    case TransactionType.MOSAIC_SUPPLY_CHANGE:
      let mosaicSupplyChangeObj = {
        type: 'MosaicSupplyChange',
        // typeId: TransactionType.MOSAIC_SUPPLY_CHANGE,
        mosaicId: transactionBody.mosaicId.id.toHex(),
        direction: transactionBody.direction == 1 ? 'Increase' : 'Decrease',
        delta: transactionBody.delta.compact(),
      }
      return mosaicSupplyChangeObj
    case TransactionType.MODIFY_MULTISIG_ACCOUNT:

      let modifyMultisigAccountObj = {
        type: 'ModifyMultisigAccount',
        // typeId: TransactionType.MODIFY_MULTISIG_ACCOUNT,
      }
      return modifyMultisigAccountObj

    case TransactionType.AGGREGATE_COMPLETE:
      let aggregateCompleteObj = {
        type: 'AggregateComplete',
        // typeId: TransactionType.AGGREGATE_COMPLETE,
      }
      return aggregateCompleteObj
    case TransactionType.AGGREGATE_BONDED:

      let aggregateBondedObj = {
        type: 'AggregateBonded',
        // typeId: TransactionType.AGGREGATE_BONDED,
      }
      return aggregateBondedObj

    case TransactionType.LOCK:
      let lockObj = {
        type: 'Lock',
        // typeId: TransactionType.LOCK,
      }
      return lockObj
    case TransactionType.SECRET_LOCK:
      let secretLockObj = {
        type: 'SecretLock',
        // typeId: TransactionType.SECRET_LOCK,
      }
      return secretLockObj
    case TransactionType.SECRET_PROOF:
      let secretProofObj = {
        type: 'SecretProof',
        // typeId: TransactionType.SECRET_PROOF,
      }
      return secretProofObj
    case TransactionType.MODIFY_ACCOUNT_PROPERTY_ADDRESS:
      let modifyAccountPropertyAddressObj = {
        type: 'ModifyAccountPropertyAddress',
        // typeId: TransactionType.MODIFY_ACCOUNT_PROPERTY_ADDRESS,
      }
      return modifyAccountPropertyAddressObj
    case TransactionType.MODIFY_ACCOUNT_PROPERTY_MOSAIC:
      let modifyAccountPropertyMosaicObj = {
        type: 'ModifyAccountPropertyMosaic',
        // typeId: TransactionType.MODIFY_ACCOUNT_PROPERTY_MOSAIC,
      }
      return modifyAccountPropertyMosaicObj
    case TransactionType.MODIFY_ACCOUNT_PROPERTY_ENTITY_TYPE:
      let modifyAccountPropertyEntityTypeObj = {
        type: 'ModifyAccountPropertyEntityType',
        // typeId: TransactionType.MODIFY_ACCOUNT_PROPERTY_ENTITY_TYPE,
      }
      return modifyAccountPropertyEntityTypeObj
    case TransactionType.LINK_ACCOUNT:
      let linkAccountObj = {
        type: 'LinkAccount',
        // typeId: TransactionType.LINK_ACCOUNT,
      }
      return linkAccountObj
  }
}

// FORMAT NAMESPACES
const formatNamespaces = namespacesInfo =>
  namespacesInfo
    .filter((ns, index, namespaces) => {
      for (let i = 0; i < index; i += 1) {
        if (ns === namespaces[i]) return false
      }
      return true
    })
    .sort((a, b) => {
      const nameA = a.namespaceInfo.metaId
      const nameB = b.namespaceInfo.metaId
      if (nameA < nameB) {
        return -1
      }
      if (nameA > nameB) {
        return 1
      }
      return 0
    })
    .map((ns, index, original) => {
      const name = ns.namespaceInfo.levels
        .map(level => original.find(n => n.namespaceInfo.id.equals(level)))
        .map(n => n.namespaceName.name)
        .join('.')
      let aliasText
      let aliasType
      switch (ns.namespaceInfo.alias.type) {
        case 1:
          aliasText = new UInt64(ns.namespaceInfo.alias.mosaicId).toHex()
          aliasType = 'Mosaic'
          break
        case 2:
          aliasText = Address.createFromEncoded(
            ns.namespaceInfo.alias.address
          ).pretty()
          aliasType = 'Address'
          break
        default:
          aliasText = false
          aliasType = 'no alias'
          break
      }
      return {
        owner: ns.namespaceInfo.owner,
        namespaceName: name,
        hexId: ns.namespaceInfo.id.toHex(),
        type:
          ns.namespaceInfo.type === 0 ? 'Root' : 'Child',
        aliastype: aliasType,
        alias: aliasText,
        aliasAction:
          ns.namespaceInfo.alias.type === 0
            ? AliasActionType.Link
            : AliasActionType.Unlink,
        currentAliasType: ns.namespaceInfo.alias.type,

        active: ns.namespaceInfo.active,
        startHeight: ns.namespaceInfo.startHeight.compact(),
        endHeight: name.includes('nem')
          ? 'Infinity'
          : ns.namespaceInfo.endHeight.compact(),
        parentId: ns.namespaceInfo.parentId.id.toHex(),
      }
    })

// FORMAT NAMESPACE
const formatNamespace = (namespaceInfo, namespaceNames) => {
  let aliasText
  let aliasType
  switch (namespaceInfo.alias.type) {
    case 1:
      aliasText = new UInt64(namespaceInfo.alias.mosaicId).toHex()
      aliasType = 'Mosaic'
      break
    case 2:
      aliasText = Address.createFromEncoded(
        namespaceInfo.alias.address
      ).pretty()
      aliasType = 'Address'
      break
    default:
      aliasText = false
      aliasType = 'no alias'
      break
  }

  let namespaceObj = {
    owner: namespaceInfo.owner,
    namespaceName: namespaceInfo.name,
    hexId: namespaceInfo.id.toHex().toUpperCase(),
    type: namespaceInfo.type === 0 ? 'ROOT' : 'SUB',
    startHeight: namespaceInfo.startHeight.compact(),
    endHeight: namespaceInfo.name.includes('nem')
      ? 'Infinity'
      : namespaceInfo.endHeight.compact(),
    active: namespaceInfo.active.toString().toUpperCase(),
    aliastype: aliasType,
    alias: aliasText,
    parentHexId: namespaceInfo.parentId.id.toHex().toUpperCase(),
    parentName:
      namespaceInfo.type !== 0 ? namespaceInfo.name.split('.')[0].toUpperCase() : '',
    levels: namespaceNames
  }

  return namespaceObj
}

export default {
  formatAddress,
  formatFee,
  formatHeight,
  formatTimestamp,
  formatBlocks,
  formatBlock,
  formatAccount,
  formatMosaics,
  formatTransactions,
  formatTransaction,
  formatTransactionBody,
  formatNamespaces,
  formatNamespace,
}
