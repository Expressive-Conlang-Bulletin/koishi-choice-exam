export function array_same(array1: Array<any>, array2: Array<any>) {
	return array1.length === array2.length && array1.every((value, index) => value === array2[index])
}

export function array_union<T>(array: Array<T>): Array<T> {
	let array2 = array.filter((elem, index, self) => { // Delete duplicates
		return index === self.indexOf(elem)
	})
	array2.sort()
	return array2
}

export function array_to_string(array: Array<number>): Array<string> {
	return array.map((val) => val.toString())
}

export function array_to_number(array: Array<string>): Array<number> {
	return array.map((val) => Number(val))
}