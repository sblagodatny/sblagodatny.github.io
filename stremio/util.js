// Each object must have id attribute
export function outerJoin(listA, listB, nameA, nameB) {
	const mergedMap = new Map();

	// Process the first list
	listA.forEach(item => {
		const { id, ...rest } = item;
		mergedMap.set(id, {
			id,
			[nameA]: rest,
			[nameB]: null // Initialize nameB as null in case there's no match
		});
	});

	// Process the second list
	listB.forEach(item => {
		const { id, ...rest } = item;
		
		if (mergedMap.has(id)) {
			// If the ID exists, keep the existing nameA data and add nameB data
			const existing = mergedMap.get(id);
			mergedMap.set(id, {
				...existing,
				[nameB]: rest
			});
		} else {
			// If it's a new ID, create the structure with nameA as null
			mergedMap.set(id, {
				id,
				[nameA]: null,
				[nameB]: rest
			});
		}
	});

	return Array.from(mergedMap.values());		
}