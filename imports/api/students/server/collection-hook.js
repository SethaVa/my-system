import AutoId from '../../../lib/auto-id'
import Students from '../students'

Students.before.insert(function(userId, doc) {
  doc._id = AutoId.make(Students, {
    length: 8,
  })
})
