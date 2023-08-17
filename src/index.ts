declare module 'koishi' {
  interface User {
    exam_ongoing: number,
    exam_passed: number[]
  }
}

import { Context, Session, Schema } from 'koishi'

import ExamJSON1 from './test.json';

export const name = 'choice-rating'

export interface Config {}

// export const Config: Schema<Config> = Schema.object({})

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

function checkAnswer(answer: string, exam_id: number): string {
  let exam_object;
  switch (exam_id) {
    case 1:
    default: {
      exam_object = ExamJSON1
      break;
    }
  }
  let i = 0;
  let score = 0;
  let len = answer.length;
  for (let problem of exam_object) {
    switch (problem.type) {
      case "single-match": {
        if (i >= len) { break; }
        let ans: string;
        do {
          ans = answer[i++]
        } while (ans == " " || ans == "\n");
        console.log(ans);
        if (problem['answer-range'].every((choice) => choice != ans)) {
          return `Invalid Option at position ${i}.`
        } else if (problem.answer == ans) {
          score += problem.score
        }
        break;
      }

      case "single-match-any": {
        if (i >= len) { break; }
        let ans: string;
        do {
          ans = answer[i++]
        } while (ans == " " || ans == "\n");
        console.log(ans);
        let potential_score = problem.answer[ans];
        if (potential_score != undefined) {
          score += potential_score
        } else {
          return `Invalid Option at position ${i}.`
        }
        break;
      }

      case "multiple-match": {
        if (i >= len) { break; }
        let ans: string;
        do {
          ans = answer[i++]
        } while (ans == " " || ans == "\n");
        let ans_list = [];
        do {
          if (problem['answer-range'].every((choice) => choice != ans)) {
            return `Invalid Option at position ${i}.`
          } else {
            ans_list.push(ans);
          }
          ans = answer[i]
        } while (ans != " " && ans != "\n" && i++ < len);
        console.log(ans_list);
        if (array_same(ans_list, problem.answer)) {// maybe should remove duplicates, however im lazy here
          score += problem.score
        }
        break;
      }

      case "multiple-match-any": {
        if (i >= len) { break; }
        let ans: string;
        do {
          ans = answer[i++]
        } while (ans == " " || ans == "\n");
        let ans_list = [];
        do {
          if (problem['answer-range'].every((choice) => choice != ans)) {
            return `Invalid Option at position ${i}.`
          } else {
            ans_list.push(ans);
          }
          ans = answer[i]
        } while (ans != " " && ans != "\n" && i++ < len);
        console.log(ans_list);
        for (let some of problem.answer) {
          let p_answer = some.input;
          if (array_same(ans_list, p_answer)) {// maybe should remove duplicates, however im lazy here
            score += some.score
            break
          };
        }
        break;
      }


    }
  };
  return JSON.stringify(score)
}

function array_same(array1: Array<any>, array2: Array<any>) {
  return array1.length === array2.length && array1.every((value, index) => value === array2[index])
}