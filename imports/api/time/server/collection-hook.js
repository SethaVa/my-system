import AutoId from '/imports/util/auto-id'
import TimeStudy from '../times'

TimeStudy.before.insert(function(userId, doc) {
  doc._id = AutoId.make(TimeStudy, {
    length: 2,
  })
})
