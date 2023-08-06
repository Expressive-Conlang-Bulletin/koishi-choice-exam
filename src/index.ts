declare module 'koishi' {
  interface User {
    exam_ongoing: number,
    exam_passed: number[]
  }
}

import { Context, Session, Schema } from 'koishi'

export const name = 'choice-rating'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

function testArg(arg: number) {
  if (arg < 2) {

  }
}

export function apply(ctx: Context) {
  ctx.model.extend('user', {
    exam_ongoing: "unsigned",
    exam_passed: "list",
  })

  ctx.command('exam [arg:number]')
    .userFields(['exam_ongoing'])
    .action(({session}, arg) => {
      if(arg) {
        session.user.exam_ongoing = arg;
      } else {
        return 'exam list'
      }
    })

  ctx.command('show')
    .userFields(['exam_ongoing'])
    .action(({session}) => JSON.stringify(session.user.exam_ongoing))

  ctx.command('submit <answer:text>')
    .userFields(['exam_ongoing'])
    .action(({session}, answer) => checkAnswer(answer, session.user.exam_ongoing))
}

function checkAnswer(answer: string, exam: number) {
  return answer
}