/*
 *
 * Copyright (c) 2019-present for symbol
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

import http from './http';
import helper from '../helper';
import { Constants } from '../config';
import { NamespaceService } from '../infrastructure';
import { Address } from 'symbol-sdk';

class CreateTransaction {
    static transferTransaction = async (transactionObj) => {
    	const [resolvedAddress, mosaicsFieldObject] = await Promise.all([
    		helper.resolvedAddress(transactionObj.recipientAddress),
    		helper.MosaicsFieldObjectBuilder(transactionObj.mosaics)
    	]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			message: transactionObj.message.payload,
    			recipient: resolvedAddress,
    			mosaics: mosaicsFieldObject
    		}
    	};
    }

    static namespaceRegistration = async (transactionObj) => {
    	return {
    		...transactionObj,
  			transactionBody: {
  				recipient: http.networkConfig.NamespaceRentalFeeSinkAddress.address,
  				registrationType: Constants.NamespaceRegistrationType[transactionObj.registrationType],
  				namespaceName: transactionObj.namespaceName,
  				namespaceId: transactionObj.namespaceId.toHex(),
  				parentId: typeof transactionObj.parentId !== 'undefined' ? transactionObj.parentId?.toHex() : Constants.Message.UNAVAILABLE,
  				duration: typeof transactionObj.duration !== 'undefined' ? transactionObj.duration?.compact() : Constants.Message.UNLIMITED
  			}
    	};
    }

    static addressAlias = async (transactionObj) => {
    	const namespaceName = await NamespaceService.getNamespacesNames([transactionObj.namespaceId]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			aliasAction: Constants.AliasAction[transactionObj.aliasAction],
    			namespaceId: transactionObj.namespaceId.toHex(),
    			namespaceName: namespaceName,
    			address: transactionObj.address.address
    		}
    	};
    }

    static mosaicAlias = async (transactionObj) => {
    	const namespaceName = await NamespaceService.getNamespacesNames([transactionObj.namespaceId]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			aliasAction: Constants.AliasAction[transactionObj.aliasAction],
    			namespaceId: transactionObj.namespaceId.id.toHex(),
    			namespaceName: namespaceName,
    			mosaicId: transactionObj.mosaicId.id.toHex()
    		}
    	};
    };

    static mosaicDefinition = async (transactionObj) => {
    	const resolvedMosaic = await helper.resolvedMosaic(transactionObj.mosaicId);

    	return {
    		...transactionObj,
    		transactionBody: {
    			recipient: http.networkConfig.MosaicRentalSinkAddress.address,
    			mosaicId: resolvedMosaic.toHex(),
    			divisibility: transactionObj.divisibility,
    			duration: transactionObj.duration.compact(),
    			nonce: transactionObj.nonce.toHex(),
    			supplyMutable: transactionObj.flags.supplyMutable,
    			transferable: transactionObj.flags.transferable,
    			restrictable: transactionObj.flags.restrictable
    		}
    	};
    };

    static mosaicSupplyChange = async (transactionObj) => {
    	const resolvedMosaic = await helper.resolvedMosaic(transactionObj.mosaicId);

    	return {
    		...transactionObj,
    		transactionBody: {
    			mosaicId: resolvedMosaic.toHex(),
    			action: Constants.MosaicSupplyChangeAction[transactionObj.action],
    			delta: transactionObj.delta.compact()
    		}
    	};
    };

    static multisigAccountModification = async (transactionObj) => {
    	const [addressAdditions, addressDeletions] = await Promise.all([
    		transactionObj.addressAdditions.map(address => {
    			return helper.resolvedAddress(address.address);
    		}),
    		transactionObj.addressDeletions.map(address => {
    			return helper.resolvedAddress(address.address);
    		})
    	]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			minApprovalDelta: transactionObj.minApprovalDelta,
    			minRemovalDelta: transactionObj.minRemovalDelta,
    			addressAdditions: addressAdditions,
    			addressDeletions: addressDeletions
    		}
    	};
    }

    static hashLock = async (transactionObj) => {
    	const resolvedMosaic = await helper.resolvedMosaic(transactionObj.mosaic);
    	const mosaicAliasName = await helper.getSingleMosaicAliasName(resolvedMosaic);

    	return {
    		...transactionObj,
    		transactionBody: {
    			duration: transactionObj.duration.compact(),
    			mosaicId: resolvedMosaic.toHex(),
    			mosaicAliasName: mosaicAliasName,
    			amount: helper.toNetworkCurrency(transactionObj.mosaic.amount),
    			hash: transactionObj.hash
    		}
    	};
    }

    static secretLock = async (transactionObj) => {
    	const [mosaicsFieldObject, resolvedAddress] = await Promise.all([
    		helper.MosaicsFieldObjectBuilder([transactionObj.mosaic]),
    		helper.resolvedAddress(transactionObj.recipientAddress)
    	]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			duration: transactionObj.duration.compact(),
    			mosaics: mosaicsFieldObject,
    			secret: transactionObj.secret,
    			recipient: resolvedAddress,
    			hashAlgorithm: Constants.LockHashAlgorithm[transactionObj.hashAlgorithm]
    		}
    	};
    };

    static secretProof = async (transactionObj) => {
    	const resolvedAddress = await helper.resolvedAddress(transactionObj.recipientAddress);

    	return {
    		...transactionObj,
    		transactionBody: {
    			hashAlgorithm: Constants.LockHashAlgorithm[transactionObj.hashAlgorithm],
    			recipient: resolvedAddress,
    			secret: transactionObj.secret,
    			proof: transactionObj.proof
    		}
    	};
    };

    static accountAddressRestriction = async (transactionObj) => {
    	const [addressAdditions, addressDeletions] = await Promise.all([
    		transactionObj.restrictionAdditions.map(restriction => {
    			return helper.resolvedAddress(restriction.address);
    		}),
    		transactionObj.restrictionDeletions.map(restriction => {
    			return helper.resolvedAddress(restriction.address);
    		})
    	]);

    	return {
    		...transactionObj,
    		transactionBody: {
    			restrictionType: Constants.AddressRestrictionFlag[transactionObj.restrictionFlags],
    			restrictionAddressAdditions: addressAdditions,
    			restrictionAddressDeletions: addressDeletions
    		}
    	};
    };

    static accountMosaicRestriction = async (transactionObj) => {
    	// Todo: mosaic restriction field
    	return {
    		...transactionObj,
    		transactionBody: {
    			restrictionType: Constants.MosaicRestrictionFlag[transactionObj.restrictionFlags],
    			restrictionMosaicAdditions: transactionObj.restrictionAdditions.map(restriction => restriction.id.toHex()),
    			restrictionMosaicDeletions: transactionObj.restrictionDeletions.map(restriction => restriction.id.toHex())
    		}
    	};
    }

    static accountOperationRestriction = async (transactionObj) => {
    	return {
    		...transactionObj,
    		transactionBody: {
    			restrictionType: Constants.OperationRestrictionFlag[transactionObj.restrictionFlags],
				restrictionOperationAdditions: transactionObj.restrictionAdditions.map(operation => operation),
				restrictionOperationDeletions: transactionObj.restrictionDeletions.map(operation => operation)
    		}
    	};
    };

    static mosaicAddressRestriction = async (transactionObj) => {
    	const [resolvedMosaic, targetAddress] = await Promise.all([
    		helper.resolvedMosaic(transactionObj.mosaicId),
    		helper.resolvedAddress(transactionObj.targetAddress)
    	]);

    	const mosaicAliasName = await helper.getSingleMosaicAliasName(resolvedMosaic);

    	return {
    		...transactionObj,
    		transactionBody: {
    			mosaicId: resolvedMosaic.toHex(),
    			mosaicAliasName: mosaicAliasName,
    			targetAddress: targetAddress,
    			restrictionKey: transactionObj.restrictionKey.toHex(),
    			previousRestrictionValue: transactionObj.previousRestrictionValue.toString(),
    			newRestrictionValue: transactionObj.newRestrictionValue.toString()
    		}
    	};
    };

    static mosaicGlobalRestriction = async (transactionObj) => {
    	const referenceMosaicId = transactionObj.referenceMosaicId.toHex() === '0000000000000000' ? transactionObj.mosaicId : transactionObj.referenceMosaicId;
    	const mosaicAliasName = await helper.getSingleMosaicAliasName(referenceMosaicId);

    	return {
    		...transactionObj,
    		transactionBody: {
    			referenceMosaicId: referenceMosaicId.toHex(),
    			mosaicAliasName: mosaicAliasName,
    			restrictionKey: transactionObj.restrictionKey.toHex(),
    			previousRestrictionType: Constants.MosaicRestrictionType[transactionObj.previousRestrictionType],
    			previousRestrictionValue: transactionObj.previousRestrictionValue.compact(),
    			newRestrictionType: Constants.MosaicRestrictionType[transactionObj.newRestrictionType],
    			newRestrictionValue: transactionObj.newRestrictionValue.compact()
    		}
    	};
    };

    static accountMetadata = async (transactionObj) => {
    	const resolvedAddress = await helper.resolvedAddress(transactionObj.targetAddress);

    	return {
    		...transactionObj,
    		transactionBody: {
    			scopedMetadataKey: transactionObj.scopedMetadataKey.toHex(),
    			targetAddress: resolvedAddress,
    			metadataValue: transactionObj.value,
    			valueSizeDelta: transactionObj.valueSizeDelta
    		}
    	};
    };

    static mosaicMetadata = async (transactionObj) => {
    	const [resolvedMosaic, resolvedAddress] = await Promise.all([
    		helper.resolvedMosaic(transactionObj.targetMosaicId),
    		helper.resolvedAddress(transactionObj.targetAddress.address)
    	]);
    	const mosaicAliasName = await helper.getSingleMosaicAliasName(resolvedMosaic);

    	return {
    		...transactionObj,
    		transactionBody: {
    			scopedMetadataKey: transactionObj.scopedMetadataKey.toHex(),
    			targetMosaicId: resolvedMosaic.toHex(),
    			targetMosaicAliasName: mosaicAliasName,
    			targetAddress: resolvedAddress,
    			metadataValue: transactionObj.value,
    			valueSizeDelta: transactionObj.valueSizeDelta
    		}
    	};
    };

    static namespaceMetadata = async (transactionObj) => {
    	const [namespaceName, resolvedAddress] = await Promise.all(
    		NamespaceService.getNamespacesNames([transactionObj.targetNamespaceId]),
    		helper.resolvedAddress(transactionObj.targetAddress.address)
    	);

    	return {
    		...transactionObj,
    		transactionBody: {
    			scopedMetadataKey: transactionObj.scopedMetadataKey.toHex(),
    			targetNamespaceId: transactionObj.targetNamespaceId.toHex(),
    			namespaceName: namespaceName,
    			targetAddress: resolvedAddress,
    			metadataValue: transactionObj.value,
    			valueSizeDelta: transactionObj.valueSizeDelta
    		}
    	};
    };

    static votingKeyLink = async (transactionObj) => {
    	return {
    		...transactionObj,
    		transactionBody: {
    			linkAction: Constants.LinkAction[transactionObj.linkAction],
    			linkedPublicKey: transactionObj.linkedPublicKey,
    			linkedAccountAddress: Address.createFromPublicKey(transactionObj.linkedPublicKey, http.networkType).plain(),
    			startEpoch: transactionObj.startEpoch,
    			endEpoch: transactionObj.endEpoch
    		}
    	};
    };

    static vrfKeyLink = async (transactionObj) => {
    	return {
    		...transactionObj,
    		transactionBody: {
    			linkAction: Constants.LinkAction[transactionObj.linkAction],
    			linkedPublicKey: transactionObj.linkedPublicKey,
    			linkedAccountAddress: Address.createFromPublicKey(transactionObj.linkedPublicKey, http.networkType).plain()
    		}
    	};
    };

    static nodeKeyLink = async (transactionObj) => {
    	return {
    		...transactionObj,
    		transactionBody: {
    			linkAction: Constants.LinkAction[transactionObj.linkAction],
    			linkedPublicKey: transactionObj.linkedPublicKey,
    			linkedAccountAddress: Address.createFromPublicKey(transactionObj.linkedPublicKey, http.networkType).plain()
    		}
    	};
    };

    static accountKeyLink = async (transactionObj) => {
    	return {
    		...transactionObj,
    		transactionBody: {
    			linkAction: Constants.LinkAction[transactionObj.linkAction],
    			linkedPublicKey: transactionObj.linkedPublicKey,
    			linkedAccountAddress: Address.createFromPublicKey(transactionObj.linkedPublicKey, http.networkType).plain()
    		}
    	};
    };
};

export default CreateTransaction;
