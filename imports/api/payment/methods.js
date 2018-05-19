import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin'
import SimpleSchema from 'simpl-schema'

import Payment from './payment'
import PaymentDetails from './payment-details'
import Exchange from '../exchanges/exchanges'
import _ from 'lodash'
import moment from 'moment'

import {
  insertIncome,
  removeIncomeFromOther,
  updateIncomeForPaymentNew,
} from '../Income/methods'
import SalaryRate from '../salary-rate/salaryRate'

// Find All Data
export const findPayment = new ValidatedMethod({
  name: 'findPayment',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector, option }) {
    if (Meteor.isServer) {
      selector = selector || {}
      option = option || {}

      return Payment.find(selector, option).fetch()
    }
  },
})

export const findPaymentForClass = new ValidatedMethod({
  name: 'findPaymentForClass',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector }) {
    if (Meteor.isServer) {
      selector = selector || {}
      // option = option || {}
      return aggregatePayment(selector)
    }
  },
})

export const findClassForStudenDetails = new ValidatedMethod({
  name: 'findClassForStudenDetails',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector }) {
    if (Meteor.isServer) {
      selector = selector || {}
      // option = option || {}
      return aggregatePayment(selector)
    }
  },
})

// find One
export const findOnePayment = new ValidatedMethod({
  name: 'findOnePayment',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ _id }) {
    if (Meteor.isServer) {
      return Payment.findOne(_id)
    }
  },
})

// Find Data For Options
export const findPaymentOpts = new ValidatedMethod({
  name: 'findPaymentOpts',
  mixins: [CallPromiseMixin],
  validate: null,
  run(selector, option) {
    if (Meteor.isServer) {
      selector = selector || {}
      option = option || {}
      let data = []
      let Payment = Payment.find(selector, option).fetch()
      _.forEach(Payment, o => {
        data.push({
          label: o._id + '-' + o.PaymentName,
          value: o._id,
        })
      })
      return data
    }
  },
})
// For New Student
export const insertPayementForNew = new ValidatedMethod({
  name: 'insertPaymentForNew',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    doc: Payment.schema,
  }).validator(),
  run({ doc }) {
    if (Meteor.isServer) {
      // let paymentDate = []
      // for (let m = doc.payDate; m < doc.endPayDate; m.setMonth(m.getMonth() + 1)) {

      //   paymentDate.push(m)

      // }
      // doc.paymentDate = paymentDate

      Payment.insert(doc, (error, paymentId) => {
        if (!error) {
          let paymentDetails = {
            totalRecieve: doc.totalRecieve,
            fee: doc.fee,
            tranDate: doc.tranDate,
            payDate: doc.payDate,
            endPayDate: doc.endPayDate,
            refType: doc.refType,
            paymentId: paymentId,
            totalPay: doc.totalPay,
            duration: doc.duration,
            type: doc.type,
          }
          InsertPaymentDetails({
            doc: paymentDetails,
          })
          // Income

          let data = {
            tranDate: doc.tranDate,
            referenceId: paymentId,
            referenceType: 'New',
            totalUsd: doc.usd,
            totalKhr: doc.khr,
          }
          insertIncome.run({
            doc: data,
          })
        } else {
          console.log(error)
        }
      })

      return 'Success'
    }
  },
})
// update for new Student
export const updatePayementForNew = new ValidatedMethod({
  name: 'updatePayementForNew',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ doc }) {
    if (Meteor.isServer) {
      let _id = doc._id
      Payment.update(
        {
          _id: _id,
        },
        {
          $set: doc,
        },
        error => {
          if (!error) {
            // Remove Before Insert
            PaymentDetails.remove({
              refId: doc._id,
            })
            // Details Payment
            let paymentDetails = {
              totalRecieve: doc.totalRecieve,
              fee: doc.fee,
              tranDate: doc.tranDate,
              payDate: doc.payDate,
              endPayDate: doc.endPayDate,
              refType: doc.refType,
              paymentId: doc._id,
              totalPay: doc.totalPay,
              duration: doc.duration,
              type: doc.type,
            }
            InsertPaymentDetails({
              doc: paymentDetails,
            })

            // Income
            let data = {
              tranDate: doc.tranDate,
              referenceId: _id,
              referenceType: 'New',
              totalUsd: doc.usd,
              totalKhr: doc.khr,
            }
            updateIncomeForPaymentNew.run({
              doc: data,
            })
          }
        }
      )

      return 'Success'
    }
  },
})

// Insert សំរាបើសិស្សចាស់ដែលគាតមកបងលុយ
export const insertPayment = new ValidatedMethod({
  name: 'insertPayment',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    doc: _.clone(Payment.schema).extend({
      paymentId: String,
    }),
  }).validator(),
  run({ doc }) {
    if (Meteor.isServer) {
      try {
        Payment.insert(doc, (error, paymentId) => {
          if (!error) {
            // Update Status Expire Payement
            let value = 'Closed'
            updatePaymentStatus.run({
              _id: doc.lastId,
              value,
            })
            // let data = Payment.findOne({
            //   _id: doc.lastId
            // })
            // let paymentDetails = {
            //   totalRecieve: data.totalRecieve,
            //   fee: doc.fee,
            //   tranDate: doc.tranDate,
            //   payDate: doc.payDate,
            //   endPayDate: doc.endPayDate,
            //   refType: doc.refType,
            //   paymentId: paymentId,
            //   totalPay: doc.totalPay,
            //   duration: doc.duration,
            //   type: doc.type
            // }
            // InsertPaymentDetails({
            //   doc: paymentDetails
            // })

            let dataIncome = {
              tranDate: doc.tranDate,
              referenceId: paymentId,
              referenceType: 'Payment',
              totalUsd: doc.usd,
              totalKhr: doc.khr,
            }
            updateIncomeForPaymentNew.run({
              doc: dataIncome,
            })
          }
        })

        return 'Success'
      } catch (error) {
        throw new Meteor.Error('Error', 'Payment', error.reason)
      }
    }
  },
})

// update សំរាបើសិស្សចាស់ដែលគាតមកបងលុយ
export const updatePaymentForPayment = new ValidatedMethod({
  name: 'updatePaymentForPayment',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    doc: Payment.schema,
  }).validator(),
  run({ doc }) {
    if (Meteor.isServer) {
      try {
        Payment.update(
          {
            _id: doc._id,
          },
          {
            $set: doc,
          },
          error => {
            if (!error) {
              // Update Status Expire Payement
              // let value = 'Closed'
              // updatePaymentStatus.run({ _id, value })
              let data = {
                tranDate: doc.tranDate,
                referenceId: doc._id,
                referenceType: 'Payment',
                totalUsd: doc.usd,
                totalKhr: doc.khr,
              }
              updateIncomeForPaymentNew.run({
                doc: data,
              })
            }
          }
        )

        return 'Success'
      } catch (error) {
        throw new Meteor.Error('Error', 'Payment', error.reason)
      }
    }
  },
})

// Update សំរាប់សិស្សដែលគាតជំពាក់លុយ រួចហើយគាតមកសងលុយវិញ
export const updatePaymentForRefund = new ValidatedMethod({
  name: 'updatePayment',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ doc }) {
    if (Meteor.isServer) {
      console.log(doc)
      Payment.update(
        {
          _id: doc._id,
        },
        {
          $set: {
            status: doc.status,
            remaining: doc.remaining,
          },
          $inc: {
            usd: doc.usd,
            khr: doc.khr,
            totalRecieve: doc.totalRecieve,
          },
        },
        error => {
          if (!error) {
            // Remove Before Insert
            PaymentDetails.remove({
              refId: doc._id,
            })
            // Insert Payment Details
            let data = Payment.findOne({
              _id: doc._id,
            })
            let paymentDetails = {
              totalRecieve: data.totalRecieve,
              fee: data.fee,
              tranDate: data.tranDate,
              payDate: data.payDate,
              endPayDate: data.endPayDate,
              refType: data.refType,
              paymentId: data._id,
              totalPay: data.totalPay,
              duration: data.duration,
              type: data.type,
            }
            InsertPaymentDetails({
              doc: paymentDetails,
            })
          }
        }
      )

      return 'Success'
    }
  },
})
// Update Status
export const updatePaymentStatus = new ValidatedMethod({
  name: 'updatePaymentStatus',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    _id: String,
    value: String,
    totalRecieve: {
      type: Number,
      optional: true,
    },
  }).validator(),
  run({ _id, value, totalRecieve }) {
    if (Meteor.isServer) {
      return Payment.update(
        {
          _id: _id,
        },
        {
          $set: {
            status: value,
          },
          $inc: totalRecieve,
        }
      )
    }
  },
})

// Delete
export const removePayment = new ValidatedMethod({
  name: 'removePayment',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    selector: {
      type: Object,
      blackbox: true,
    },
  }).validator(),
  run({ selector }) {
    if (Meteor.isServer) {
      Payment.update(
        {
          _id: selector.lastId,
        },
        {
          $set: {
            status: 'Expires',
          },
        }
      )

      Payment.remove(
        {
          _id: selector._id,
        },
        error => {
          if (!error) {
            PaymentDetails.remove({
              refId: selector._id,
            })

            removeIncomeFromOther.run({
              referenceId: selector._id,
              referenceType: selector.referenceType,
            })
          }
        }
      )
      return 'Success'
    }
  },
})
// Remove Payment from Refund
export const removePaymentFromRefund = new ValidatedMethod({
  name: 'removePaymentFromRefund',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    _id: {
      type: String,
    },
  }).validator(),
  run({ _id }) {
    if (Meteor.isServer) {
      Payment.remove({
        _id: _id,
      })

      return 'Success'
    }
  },
})

// Find Salay
export const findSalary = new ValidatedMethod({
  name: 'findSalary',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector, option }) {
    if (Meteor.isServer) {
      selector = selector || {}
      option = option || {}
      let data = aggregateSalary(selector)
      // const exchangeRate = Exchange.find({}, {
      //   sort: {
      //     _id: -1
      //   },
      //   limit: 1
      // }).fetch()

      // const salaryRate = SalaryRate.find({}, {
      //   sort: {
      //     _id: -1
      //   },
      //   limit: 1
      // }).fetch()

      // let partTiemRate = salaryRate[0].partTime / 100

      // console.log(partTiemRate)
      // _.forEach(data, o => {
      //   console.log(o.totalPay)
      // })
      return data
    }
  },
})

// const loopDate = (from, to) => {
//   let data = []

//   for (let m = from; m <= to; m.setMonth(m.getMonth() + 1)) {
//     data.push({
//       date: moment(m).format('YYYY-MM-D')
//     })
//   }

//   return data
// }

// Insert To Payment Details
const InsertPaymentDetails = ({ doc }) => {
  let i = 0
  let numOfMonth = doc.totalRecieve / doc.fee
  numOfMonth = _.floor(numOfMonth, 0)
  // if (doc.status == 'Paid') {
  for (let m = doc.payDate; m < doc.endPayDate; m.setMonth(m.getMonth() + 1)) {
    // data.push({
    //   date: moment(m).format('YYYY-MM-D')
    // })
    if (i == numOfMonth) {
      break
    }
    i++
    // doc.paymentDate.push(m);
    let data = {
      refType: doc.refType,
      refId: doc.paymentId,
      tranDate: doc.tranDate,
      fee: doc.fee,
      pay: doc.totalPay / doc.duration,
      payDate: m,
      status: 'Paid',
      type: doc.type,
    }
    PaymentDetails.insert(data)
  }
}

const aggregatePayment = selector => {
  let data = Payment.aggregate([
    {
      $match: selector,
    },
    {
      $lookup: {
        from: 'classStudy',
        localField: 'classId',
        foreignField: '_id',
        as: 'classDoc',
      },
    },
    {
      $unwind: {
        path: '$classDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'rooms',
        localField: 'classDoc.roomId',
        foreignField: '_id',
        as: 'roomDoc',
      },
    },
    {
      $unwind: {
        path: '$roomDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'timeStudy',
        localField: 'classDoc.timeId',
        foreignField: '_id',
        as: 'timeDoc',
      },
    },
    {
      $unwind: {
        path: '$timeDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: 'classDoc.subId',
        foreignField: '_id',
        as: 'subjectDoc',
      },
    },
    {
      $unwind: {
        path: '$subjectDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'staff',
        localField: 'classDoc.staffId',
        foreignField: '_id',
        as: 'staffDoc',
      },
    },
    {
      $unwind: {
        path: '$staffDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'studentDoc',
      },
    },
    {
      $unwind: {
        path: '$studentDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$classId',
        staffId: {
          $last: '$staffDoc._id',
        },
        teacher: {
          $last: '$staffDoc.name',
        },
        room: {
          $last: '$roomDoc.roomName',
        },
        subject: {
          $last: '$subjectDoc.title',
        },
        time: {
          $last: '$timeDoc.timeStudy',
        },
        classDetail: {
          $push: {
            _id: '$_id',
            classId: '$classId',
            studentId: '$studentDoc._id',
            student: '$studentDoc.enName',
            gender: '$studentDoc.gender',
            payDate: '$payDate',
            duration: '$duration',
            usd: '$usd',
            khr: '$khr',
            discountVal: '$discountVal',
            remaining: '$remaining',
            endPayDate: '$endPayDate',
            type: '$type',
            status: '$status',
          },
        },
      },
    },
    {
      $project: {
        staffId: 1,
        teacher: 1,
        room: 1,
        subject: 1,
        time: 1,
        classDetail: 1,
      },
    },
  ])
  return data
}

// Find Salary
const aggregateSalary = selector => {
  selector = selector || {}
  let data = PaymentDetails.aggregate([
    {
      $lookup: {
        from: 'payment',
        localField: 'refId',
        foreignField: '_id',
        as: 'paymentDoc',
      },
    },
    {
      $unwind: {
        path: '$paymentDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'classStudy',
        localField: 'paymentDoc.classId',
        foreignField: '_id',
        as: 'classDoc',
      },
    },
    {
      $unwind: {
        path: '$classDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'staff',
        localField: 'classDoc.staffId',
        foreignField: '_id',
        as: 'staffDoc',
      },
    },
    {
      $unwind: {
        path: '$staffDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'position',
        localField: 'staffDoc.positionId',
        foreignField: '_id',
        as: 'positionDoc',
      },
    },
    {
      $unwind: {
        path: '$positionDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'salaryRate',
        localField: 'classDoc.rateId',
        foreignField: '_id',
        as: 'rateDoc',
      },
    },
    {
      $unwind: {
        path: '$rateDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: selector,
    },
    {
      $group: {
        // _id: { staffId: '$staffDoc._id', classId: '$classDoc._id' },
        _id: '$_id',
        refId: { $last: '$refId' },
        refType: { $last: '$refType' },
        type: { $last: '$type' },
        classId: { $last: '$classDoc._id' },
        staffId: { $last: '$staffDoc._id' },
        name: { $last: '$staffDoc.name' },
        gender: { $last: '$staffDoc.gender' },
        position: { $last: '$positionDoc.position' },
        rate: { $last: '$rateDoc.partTime' },
        rateFull: { $last: '$rateDoc.fullTime' },
        payDate: { $last: '$payDate' },
        pay: { $last: '$pay' },
      },
    },
    {
      $project: {
        _id: 1,
        payDate: {
          $dateToString: { format: '%Y-%m-%d', date: '$payDate' },
        },
        name: 1,
        gender: 1,
        position: 1,
        staffId: 1,
        classId: 1,
        refId: 1,
        rate: 1,
        rateFull: 1,
        pay: 1,
        type: 1,
        refType: 1,
        // fullTime:1,
        // partTime:1,
        fullSalary: {
          // $cond: { if: { $eq: ["$type","Full Time"] }, then:{$multiply: [1,"$rateDoc.fullTime" ]},else :0   }
          $cond: {
            if: { $eq: ['$type', 'Full Time'] },
            then: { $multiply: [1, '$rateFull'] },
            else: 0,
          },
        },
        partSalary: {
          // $cond: { if: { $eq: ["$type","Part Time"] }, then:{$multiply: ["$pay",{$divide: ["$rateDoc.partTime",100 ]} ]} , else:0  }
          $cond: {
            if: { $eq: ['$type', 'Part Time'] },
            then: { $multiply: ['$pay', { $divide: ['$rate', 100] }] },
            else: 0,
          },
        },
        // totalSalary :{
        // $add: [{
        //     // $cond: { if: { $eq: ["$type","Full Time"] }, then:{$multiply: [1,"$rateDoc.fullTime" ]},else :0   }
        //     $cond: { if: { $eq: ["$type","Full Time"] }, then:{$multiply: [1,"$rateFull" ]},else :0   }

        // },{
        //     // $cond: { if: { $eq: ["$type","Part Time"] }, then:{$multiply: ["$pay",{$divide: ["$rateDoc.partTime",100 ]} ]} , else:0  }
        //     $cond: { if: { $eq: ["$type","Part Time"] }, then:{$multiply: ["$pay",{$divide: ["$rate",100 ]} ]} , else:0  }

        // }]}
      },
    },
    {
      $group: {
        _id: { staffId: '$staffId', classId: '$classId' },
        payDate: { $last: '$payDate' },
        type: { $last: '$type' },
        name: { $last: '$name' },
        gender: { $last: '$gender' },
        position: { $last: '$position' },
        staffId: { $last: '$staffId' },
        classId: { $last: '$classId' },
        totalFullSalary: { $sum: '$fullSalary' },
        totalPartSalary: { $sum: '$partSalary' },
      },
    },
    {
      $project: {
        _id: 1,
        payDate: 1,
        type: 1,
        name: 1,
        gender: 1,
        position: 1,
        staffId: 1,
        classId: 1,
        totalSalary: {
          $sum: ['$totalFullSalary', '$totalPartSalary'],
        },
      },
    },
  ])
  return data
}
