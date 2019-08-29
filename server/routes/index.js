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

var express = require('express');
var router = express.Router();
const {
	homeInfo,
	blocks,
	accounts,
	transactions,
	namespaces,
	mosaics,
} = require('../controller/index');

router.get('/homeInfo', async function(req, res, next) {
	try {
		let marketData = await homeInfo.getMarketData();
		let chainInfo = await homeInfo.getChainInfo();
		let recentBlocks = await blocks.getBlocksWithLimit(5);
		let recentTransactionList = await transactions.getTransactionList();

		res.status(200).json({
			data: {
				marketData,
				chainInfo,
				recentBlocks,
				recentTransactionList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/accounts', async function(req, res, next) {
	// Todo: get AccountsList
});

router.get('/account/:address', async function(req, res, next) {
	const address = req.params.address;

	try {
		const accountInfo = await accounts.getAccountInfoByAddress(address);
		const accountTransaction = await accounts.getAccountTransactionsByAddress(
			address
		);

		const ownedNamespaceList = await namespaces.getNamespacesFromAccountByAddress(
			address
		);

		res.status(200).json({
			data: {
				accountInfo,
				accountTransaction,
				ownedNamespaceList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/blocks', async function(req, res, next) {
	try {
		const blockList = await blocks.getBlocksWithLimit(25);

		res.status(200).json({
			data: {
				blockList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/blocks/:fromBlockHeight', async function(req, res, next) {
	const height = req.params.fromBlockHeight;

	try {
		const blockList = await blocks.getBlocksWithLimit(25, height);
		res.status(200).json({
			data: {
				blockList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/block/:height', async function(req, res, next) {
	const height = req.params.height;

	try {
		const blockInfo = await blocks.getBlockInfoByHeight(height);
		const blockTransactionList = await blocks.getBlockFullTransactionsList(
			height
		);

		res.status(200).json({
			data: {
				blockInfo,
				blockTransactionList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/transactions/:block?/:txId?', async (req, res, next) => {
	const block = req.params.block;
	const txId = req.params.txId;

	try {
		const transactionList = await transactions.getTransactionList(block,txId);

		res.status(200).json({
			data: {
				transactionList,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/transaction/:txHash', async (req, res, next) => {
	const txHash = req.params.txHash;

	try {
		const transactionInfo = await transactions.getTransactionInfoByHash(txHash);
		res.status(200).json({
			data: {
				transactionInfo,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/namespaces', (req, res, next) => {
	// Todo: get namespaces list
});

router.get('/namespace/:namespaceName', async (req, res, next) => {
	const namespaceName = req.params.namespaceName;

	try {
		const namespaceInfo = await namespaces.getNamespaceInfoByName(
			namespaceName
		);

		res.status(200).json({
			data: {
				namespaceInfo,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/mosaics', (req, res, next) => {
	// Todo: get namespaces list
});

router.get('/mosaic/:mosaicHex', async (req, res, next) => {
	const mosaicHex = req.params.mosaicHex;
	try {
		const mosaicInfo = await mosaics.getMosaicInfoByHex(mosaicHex);

		res.status(200).json({
			data: {
				mosaicInfo,
			},
		});
	} catch (error) {
		res.status(500).json({
			data: {
				message: error.message,
			},
		});
	}
});

router.get('/node', (req, res, next) => {
	// Todo: get node list
});

router.get('/statitics', (req, res, next) => {
	// Todo: get statitics info
});

router.get('*', (req, res, next) => {
	res.status(404).json({
		data: {
			message: req.params[0] + ' does not exist',
		},
	});
});

module.exports = router;
