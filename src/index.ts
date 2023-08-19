import {array_union} from './util'
import {checkAnswer} from './parser'
import ExamMetaData from './privateData/exam_info.json'
import ExamData from './privateData/exam_data.json'

declare module 'koishi' {
	interface User {
		exam_ongoing: number,
		exam_passed: string[],
		exam_quota_used: number // Not used yet, it requires many auxiliary functionalities.
	}
}

import { Context, Bot, Session, Schema } from 'koishi'

export const name = 'choice-rating'

export interface Config {}

// export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {

	// 测试科目一览
	let exam_list_info = ExamMetaData.map((exam) => 
		`${exam.required_exam}: 要进入群 ${exam.targetGroup}，须在群 ${exam.sourceGroup} 通过测试 ${exam.required_exam.toString()}`
	).join('\n')

	// 数据库添加自定义字段
	ctx.model.extend('user', {
		exam_ongoing: "unsigned",
		exam_passed: "list",
		exam_quota_used: "unsigned"// will initialized as 0
	})

	// 监听加群事件
	ctx.on('guild-member-request', async (session) => {
		console.log('database')
		let exam_object = ExamMetaData.find((elem) => elem.targetGroup == session.guildId)
		if (exam_object !== undefined) {
			let uid = session.userId
			let aid = await ctx.database.get('binding', {pid: uid}, ['aid'])
			let res = await ctx.database.get('user', {id: aid[0].aid}, ['exam_passed'])
			let passed = res[0].exam_passed
			// console.log(session)
			// console.log(res)
			// console.log(res[0].exam_passed)
			let flag: boolean
			if (typeof exam_object.required_exam === 'number') {
				flag = passed.some((elem) => elem === exam_object.required_exam.toString())
			} else {
				throw new Error('Not Implemented.')
			}
			if (flag) {
				session.bot.handleGuildMemberRequest(session.messageId, true)
			} else {
				session.bot.handleGuildMemberRequest(session.messageId, false
					, `请先在此群完成测试题: ${exam_object.sourceGroup}。`)
			}
		}
	})

	// 监听考试申请消息
	ctx.command('exam [arg:number]')
		.userFields(['exam_ongoing', 'exam_passed'])
		.action(({session}, arg) => {
			// 获取在本群可进行的测试的ID列表
			let exam_objects = ExamMetaData.filter((elem, index, self) => elem.sourceGroup == session.guildId)
			let exam_ids = []
			for (let exam_object of exam_objects) {
				if (typeof exam_object.required_exam === 'number') {
					exam_ids.push(exam_object.required_exam)
				} else {
					throw new Error('Not Implemented.')
				}
			}

			if (session.user.exam_ongoing > 0) {// 若已有测试
				if (arg == 0) {
					session.user.exam_ongoing = 0
					return "已放弃测试。"
				} else {
					return "已在测试中！"
				}
			} else {
				if(exam_ids.some((elem) => elem == arg)) {// 若该测试ID合法
					if (
						session.user.exam_passed.some((elem) => elem === arg.toString())
						// false // THIS IS FOR DEBUG
					) {
						return "你已经通过此测试！"
					} else {
						session.user.exam_ongoing = arg
						return ExamData[arg-1].question
					}
				} else {
					return exam_list_info
				}
			}
		})

	// 监听考试状态查询
	ctx.command('show')
		.userFields(['exam_ongoing', 'exam_passed'])
		.action(({session}) => {
			let ongoing: number|string = session.user.exam_ongoing
			if (ongoing == 0) ongoing = "无"
			return `已通过的测试编号：${session.user.exam_passed.join(',')}\n进行中的测试编号：${ongoing}`
		})

	// 监听答案提交消息
	ctx.command('submit <answer:text>')
		.userFields(['exam_ongoing', 'exam_passed'])
		.action(({session}, answer) => {
			// console.log(session)
			if(session.isDirect) {
				if (session.user.exam_ongoing > 0) {
					let res = process_exam(
						answer,
						session.user
					)
					session.user.exam_ongoing = 0
					return res
					return null // 对抗风控。应将消息发到群聊中，然后进行at。
				} else {
					// return "你不处于测试状态！"
					return null
				}
			} else {
				session.bot.deleteMessage(session.channelId, session.messageId)
				return "请勿在群聊提交答案！"
			}
		})
}

function process_exam(answer: string, user): string {
	let exam_id = user.exam_ongoing
	let exam_object = ExamData[exam_id - 1]
	let problem_object = exam_object.answers;
	try {
		let score = checkAnswer(answer, problem_object)
		// console.log(answer+score)
		if (score >= exam_object.requirement) {
			user.exam_passed.push(exam_id.toString())
			user.exam_passed = array_union(user.exam_passed)
			return `测试通过，得分${score}。`
		} else {
			return `测试不通过，得分${score}。`
		}
	} catch(e) {
		return e
	}
}