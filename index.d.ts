declare module "node-lmdb" {
	type Key = string | number | Buffer;
	type Value = string | number | Buffer | boolean;

	type KeyType =
		| {
			/** if true, keys are treated as 32-bit unsigned integers */
			keyIsUint32?: boolean;
		}
		| {
			/** if true, keys are treated as Buffers */
			keyIsBuffer?: boolean;
		}
		| {
			/** if true, keys are treated as strings */
			keyIsString?: boolean;
		};

	type PutOptions = {
		noDupData?: boolean;
		noOverwrite?: boolean;
		append?: boolean;
		appendDup?: boolean;
	} & KeyType;

	interface Stat {
		pageSize: number;
		treeDepth: number;
		treeBranchPageCount: number;
		treeLeafPageCount: number;
		entryCount: number;
		overflowPages: number;
	}

	interface Info {
		mapAddress: number;
		mapSize: number;
		lastPageNumber: number;
		lastTxnId: number;
		maxReaders: number;
		numReaders: number;
	}


	type CursorCallback<T> = (k: Key, v: T) => void;

	enum BatchResult {
		SUCCESS = 0,
		CONDITION_NOT_MET = 1,
		NOT_FOUND = 2,
	}

	/**
	 * Object argument for Env.batchWrite()
	 */
	interface BatchOperation {
		/** the database instance to target for the operation */
		db: Dbi;
		/** the key to target for the operation */
		key: Key;
		/** If null, treat as a DELETE operation */
		value?: Value;
		/** If provided, ifValue must match the first X bytes of the stored value or the operation will be canceled */
		ifValue?: Value;
		/** If true, ifValue must match all bytes of the stored value or the operation will be canceled */
		ifExactMatch?: boolean;
		/** If provided, use this key to determine match for ifValue */
		ifKey?: Key;
		/** If provided, use this DB to determine match for ifValue */
		ifDB?: Dbi;
	}

	/**
	 * Array argument for Env.batchWrite()
	 * @example [db: Dbi, key: Key] // DELETE operation
	 * @example [db: Dbi, key: Key, value: Value] // PUT operation
	 * @example [db: Dbi, key: Key, value: Value, ifValue: Value] // PUT IF operation
	 */
	type BatchOperationArray =
		| [db: Dbi, key: Key]
		| [db: Dbi, key: Key, value: Value]
		| [db: Dbi, key: Key, value: Value, ifValue: Value];

	/**
	 * Options for opening a database instance
	 */
	type DbiOptions = {
		/** the name of the database (or null to use the unnamed database) */
		name: string | null;
		/** if true, the database will be created if it doesn't exist */
		create?: boolean;
		/** keys are strings to be compared in reverse order */
		reverseKey?: boolean;
		/** if true, the database can hold multiple items with the same key */
		dupSort?: boolean;
		/** if dupSort is true, indicates that the data items are all the same size */
		dupFixed?: boolean;
		/** duplicate data items are also integers, and should be sorted as such */
		integerDup?: boolean;
		/** duplicate data items should be compared as strings in reverse order */
		reverseDup?: boolean;
		/** if a read/write transaction is currently open, pass it here */
		txn?: Txn;
	} & KeyType;

	interface EnvOptions {
		path?: string;
		mapSize?: number;
		maxDbs?: number;
		maxReaders?: number;
		noSubdir?: boolean;
		readOnly?: boolean;
		useWritemap?: boolean;
		usePreviousSnapshot?: boolean;
		noMemInit?: boolean;
		noReadAhead?: boolean;
		noMetaSync?: boolean;
		noSync?: boolean;
		mapAsync?: boolean;
		unsafeNoLock?: boolean;
	}

	interface TxnOptions {
		readOnly: boolean;
	}

	enum ErrorCodes {
		/**	Successful result */
		MDB_SUCCESS = 0,
		/** key/data pair already exists */
		MDB_KEYEXIST = -30799,
		/** key/data pair not found (EOF) */
		MDB_NOTFOUND = -30798,
		/** Requested page not found - this usually indicates corruption */
		MDB_PAGE_NOTFOUND = -30797,
		/** Located page was wrong type */
		MDB_CORRUPTED = -30796,
		/** Update of meta page failed or environment had fatal error */
		MDB_PANIC = -30795,
		/** Environment version mismatch */
		MDB_VERSION_MISMATCH = -30794,
		/** File is not a valid LMDB file */
		MDB_INVALID = -30793,
		/** Environment mapsize reached */
		MDB_MAP_FULL = -30792,
		/** Environment maxdbs reached */
		MDB_DBS_FULL = -30791,
		/** Environment maxreaders reached */
		MDB_READERS_FULL = -30790,
		/** Too many TLS keys in use - Windows only */
		MDB_TLS_FULL = -30789,
		/** Txn has too many dirty pages */
		MDB_TXN_FULL = -30788,
		/** Cursor stack too deep - internal error */
		MDB_CURSOR_FULL = -30787,
		/** Page has not enough space - internal error */
		MDB_PAGE_FULL = -30786,
		/** Database contents grew beyond environment mapsize */
		MDB_MAP_RESIZED = -30785,
		/** Operation and DB incompatible, or DB type changed. This can mean:
		 *	<ul>
		 *	<li>The operation expects an #MDB_DUPSORT / #MDB_DUPFIXED database.
		 *	<li>Opening a named DB when the unnamed DB has #MDB_DUPSORT / #MDB_INTEGERKEY.
		 *	<li>Accessing a data record as a database, or vice versa.
		 *	<li>The database was dropped and recreated with different flags.
		 *	</ul>
		 */
		MDB_INCOMPATIBLE = -30784,
		/** Invalid reuse of reader locktable slot */
		MDB_BAD_RSLOT = -30783,
		/** Transaction must abort, has a child, or is invalid */
		MDB_BAD_TXN = -30782,
		/** Unsupported size of key/DB name/data, or wrong DUPFIXED size */
		MDB_BAD_VALSIZE = -30781,
		/** The specified DBI was changed unexpectedly */
		MDB_BAD_DBI = -30780,
		/** Unexpected problem - txn should abort */
		MDB_PROBLEM = -30779,
		/** The last defined error code */
		MDB_LAST_ERRCODE
	}

	class Env {
		open(options: EnvOptions): void;

		/**
		 * Open a database instance
		 * @param {DbiOptions} options
		 */
		openDbi(options: DbiOptions): Dbi;

		/**
		 * Begin a transaction
		 */
		beginTxn(options?: TxnOptions): Txn;

		/**
		 * Detatch from the memory-mapped object retrieved with getStringUnsafe()
		 * or getBinaryUnsafe(). This must be called after reading the object and
		 * before it is accessed again, or V8 will crash.
		 * @param buffer
		 */
		detachBuffer(buffer: ArrayBufferLike): void;

		/**
		 * Retrieve Environment statistics.
		 */
		stat(): Stat;

		/**
		 * Gets information about the database environment.
		 */
		info(): Info;

		/**
		 * Dump the entries in the reader lock table.
		 */
		readers(): string;

		/**
		 * Check for stale entries in the reader lock table.
		 * @return Number of stale slots that were cleared
		 */
		readersCheck(): number;

		/**
		 * Count of freepages
		 */
		getFreePagesCount(): number;

		/**
		 * Resizes the maximal size of the memory map. It may be called if no transactions are active in this process.
		 * @param {number} size maximal size of the memory map (the full environment) in bytes (default is 10485760 bytes)
		 */
		resize(size: number): void;

		/**
		 * When `batchWrite` is called, `node-ldmb` will asynchronously create a
		 * new write transaction, execute all the operations in the provided
		 * array, except for any conditional writes where the condition failed,
		 * and commit the transaction, if there were no errors. For conditional
		 * writes, if the condition did not match, the write will be skipped,
		 * but the transaction will still be committed. However, if any errors
		 * occur, the transaction will be aborted. This entire transaction will
		 * be created by `node-lmdb` and executed in a separate thread. The
		 * callback function will be called once the transaction is finished. It
		 * is possible for an explicit write transaction in the main JS thread
		 * to block or be blocked by the asynchronous transaction.
		 * @param {Array} operations
		 * @param {object} options
		 * @param {Function} options.progress callback function for reporting
		 *                                    progress on a batch operation.
		 * @param callback
		 */
		batchWrite(
			operations: (BatchOperation | BatchOperationArray)[],
			options?: PutOptions & {
				progress?: (results: BatchResult[]) => void;
			},
			callback?: (err: Error, results: BatchResult[]) => void
		): void;

		copy(
			path: string,
			compact?: boolean,
			callback?: (err: Error) => void
		): void;

		sync(): void;

		/**
		 * Close the environment
		 */
		close(): void;
	}

	type DropOptions = { txn?: Txn; justFreePages: boolean };

	/**
	 * Database Instance: represents a single K/V store.
	 */
	type Dbi = {
		close(): void;
		drop(options?: DropOptions): void;
		stat(tx: Txn): Stat;
	};

	/**
	 * Transaction (read-only or read-write)
	 */
	type Txn = {
		getString(dbi: Dbi, key: Key, options?: KeyType): string;
		putString(dbi: Dbi, key: Key, value: string, options?: PutOptions): void;

		getBinary(dbi: Dbi, key: Key, options?: KeyType): Buffer;
		putBinary(dbi: Dbi, key: Key, value: Buffer, options?: PutOptions): void;

		getNumber(dbi: Dbi, key: Key, options?: KeyType): number;
		putNumber(dbi: Dbi, key: Key, value: number, options?: PutOptions): void;

		getBoolean(dbi: Dbi, key: Key, options?: KeyType): boolean;
		putBoolean(dbi: Dbi, key: Key, value: boolean, options?: PutOptions): void;

		del(dbi: Dbi, key: Key, options?: KeyType): void;
		del(dbi: Dbi, key: Key, value: Buffer | string | number | boolean, options?: KeyType): void;

		/**
		 * Retrieve a string using zero-copy semantics. Env.detachBuffer() must
		 * be called on the underlying buffer after the data is accessed.
		 */
		getStringUnsafe(dbi: Dbi, key: Key, options?: KeyType): string;

		/**
		 * Retrieve a Buffer using zero-copy semantics. Env.detachBuffer() must
		 * be called on the underlying buffer after the data is accessed.
		 */
		getBinaryUnsafe(dbi: Dbi, key: Key, options?: KeyType): Buffer;

		/**
		 * Commit and close the transaction
		 */
		commit(): void;

		/**
		 * Abort and close the transaction
		 */
		abort(): void;

		/**
		 * Abort a read-only transaction, but makes it renewable by calling
		 * renew().
		 */
		reset(): void;

		/**
		 * Renew a read-only transaction after it has been reset.
		 */
		renew(): void;
	};

	interface DelOptions {
		noDupData: boolean;
	}
	class Cursor<T extends Key = string> {
		constructor(txn: Txn, dbi: Dbi, keyType?: KeyType);

		goToFirst(options?: KeyType): T | null;
		goToLast(options?: KeyType): T | null;
		goToNext(options?: KeyType): T | null;
		goToPrev(options?: KeyType): T | null;
		goToKey(key: T, options?: KeyType): T | null;
		goToRange(key: T, options?: KeyType): T | null;

		goToFirstDup(options?: KeyType): T | null;
		goToLastDup(options?: KeyType): T | null;
		goToNextDup(options?: KeyType): T | null;
		goToPrevDup(options?: KeyType): T | null;
		goToNextNoDup(options?: KeyType): T | null;
		goToPrevNoDup(options?: KeyType): T | null;
		goToDup(key: T, data: Value, options?: KeyType): T | null;
		goToDupRange(key: T, data: Value, options?: KeyType): T | null;

		getCurrentNumber(fn?: CursorCallback<number>): number | null;
		getCurrentBoolean(fn?: CursorCallback<boolean>): boolean | null;
		getCurrentString(fn?: CursorCallback<string>): string | null;
		getCurrentBinary(fn?: CursorCallback<Buffer>): Buffer | null;

		getCurrentStringUnsafe(fn?: CursorCallback<string>): string | null;
		getCurrentBinaryUnsafe(fn?: CursorCallback<Buffer>): Buffer | null;

		del(options?: DelOptions): void;
		put(key: Key, value: Value, options?: PutOptions): void;

		close(): void;

		count(): number;
		exists(key: Value, data?: Value): boolean;
	}
}
