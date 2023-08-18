import {array_same, array_union} from './util'

export function checkAnswer(answer: string, exam_object): number {
	let i = 0
	let score = 0
	let len = answer.length
	for (let problem of exam_object) {
		// console.log(problem.type)
		switch (problem.type) {
			case undefined: {
				throw new Error(`Problem is invalid. Please contact the administrator.`)
				break
			}
			case "single-match": {
				if (i >= len) { break }
				let ans: string
				do {
					ans = answer[i++]
				} while (ans == " " || ans == "\n")
				// console.log(ans)
				if (problem['answer-range'].every((choice) => choice != ans)) {
					throw new Error(`Invalid choice at position ${i}.`)
				} else if (problem.answer == ans) {
					score += problem.score
				}
				break
			}

			case "single-match-any": {
				if (i >= len) { break }
				let ans: string
				do {
					ans = answer[i++]
				} while (ans == " " || ans == "\n")
				// console.log(ans)
				let potential_score = problem.answer[ans]
				if (potential_score != undefined) {
					score += potential_score
				} else {
					throw new Error(`Invalid choice at position ${i}.`)
				}
				break
			}

			case "multiple-match": {
				if (i >= len) { break }
				let ans: string
				do {
					ans = answer[i++]
				} while (ans == " " || ans == "\n")
				let ans_list = []
				do {
					if (problem['answer-range'].every((choice) => choice != ans)) {
						throw new Error(`Invalid choice at position ${i}.`) // Need not plus one, as `ans` is `answer[i-1]`, which has not been updated to current `i`.
					} else {
						ans_list.push(ans)
					}
					ans = answer[i]
				} while (ans != " " && ans != "\n" && i++ < len)
				// console.log(ans_list)
				if (array_same(ans_list, problem.answer)) {// maybe should remove duplicates, however im lazy here
					score += problem.score
				}
				break
			}

			case "multiple-match-any": {
				if (i >= len) { break }
				let ans: string
				do {
					ans = answer[i++]
				} while (ans == " " || ans == "\n")
				let ans_list = []
				do {
					if (problem['answer-range'].every((choice) => choice != ans)) {
						throw new Error(`Invalid choice at position ${i}.`)
					} else {
						ans_list.push(ans)
					}
					ans = answer[i]
				} while (ans != " " && ans != "\n" && i++ < len)
				// console.log(ans_list)
				for (let some of problem.answer) {
					let p_answer = some.input
					if (array_same(ans_list, p_answer)) { // maybe should remove duplicates, however im lazy here
						score += some.score
						break
					}
				}
				break
			}

			case "multiple-score-sum": {
				if (i >= len) { break }
				let ans: string
				do {
					ans = answer[i++]
				} while (ans == " " || ans == "\n")
				let ans_list = []
				do {
					ans_list.push(ans)
					ans = answer[i]
				} while (ans != " " && ans != "\n" && i++ < len)
				let this_score = 0
				ans_list = array_union(ans_list)
				// console.log(ans_list)
				for (let part of ans_list) {
					let potential_score = problem.answer[part]
					if (potential_score != undefined) {
						this_score += potential_score
					} else {
						throw new Error(`Invalid choice at position ${i}.`)
					}
				}
				// Limit score range
				let score_range = problem['score-range'];
				if (score_range !== undefined && score_range.length >= 2) {
					let score_min = score_range[0], score_max = score_range[1]
					if (this_score < score_min) {
						this_score = score_min
					} else if (this_score > score_max) {
						this_score = score_max
					}
				}
				score += this_score
				break
			}


		}
	}
	// console.log(answer+score)
	return score
}