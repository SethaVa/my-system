import { Meteor } from 'meteor/meteor'
import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin'
import SimpleSchema from 'simpl-schema'
import _ from 'lodash'
import moment from 'moment'
import SalaryRate from './salaryRate'

export const findSalaryRate = new ValidatedMethod({
  name: 'findSalaryRate',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector }) {
    if (Meteor.isServer) {
      selector = selector || {}
      return SalaryRate.find(selector, { sort: { _id: -1 }, limit: 1 }).fetch()
    }
  },
})
//find for Options
export const findSalaryRateOpts = new ValidatedMethod({
  name: 'findSalaryRateOpts',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ selector }) {
    if (Meteor.isServer) {
      selector = selector || {}
      let data = []
      let SalaryRate = SalaryRate.find(selector).fetch()

      _.forEach(SalaryRate, o => {
        data.push({
          label: o.SalaryRate,
          value: o._id,
        })
      })

      return data
    }
  },
})

export const findOneSalaryRate = new ValidatedMethod({
  name: 'findOneSalaryRate',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ id }) {
    if (Meteor.isServer) {
      return SalaryRate.findOne({ _id: id })
    }
  },
})

export const insertSalaryRate = new ValidatedMethod({
  name: 'insertSalaryRate',
  mixins: [CallPromiseMixin],
  validate: null,
  run(doc) {
    if (Meteor.isServer) {
      return SalaryRate.insert(doc)
    }
  },
})

export const updateSalaryRate = new ValidatedMethod({
  name: 'updateSalaryRate',
  mixins: [CallPromiseMixin],
  validate: null,
  run(doc) {
    if (Meteor.isServer) {
      return SalaryRate.update({ _id: doc._id }, { $set: doc })
    }
  },
})

export const removeSalaryRate = new ValidatedMethod({
  name: 'removeSalaryRate',
  mixins: [CallPromiseMixin],
  validate: new SimpleSchema({
    _id: { type: String },
  }).validator(),
  run({ _id }) {
    if (Meteor.isServer) {
      return SalaryRate.remove(_id)
    }
  },
})
