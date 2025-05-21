const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;

const Reminder = require('../models/reminderModel');
const reminderController = require('../controllers/reminderController');

describe('Reminder Controller', () => {
  afterEach(() => {
    sinon.restore();  // Restore stubs after each test
  });

  describe('Create Reminder', () => {
    it('should create a new reminder', async () => {
      const req = { body: { message: 'Test Reminder', reminderDate: new Date() } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(Reminder.prototype, 'save').resolves(req.body);

      await reminderController.createReminder(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Reminder created' })).to.be.true;
    });
  });

  describe('Get All Reminders', () => {
    it('should return all reminders', async () => {
      const fakeReminders = [{ message: 'Reminder 1' }, { message: 'Reminder 2' }];
      const req = {};
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(Reminder, 'find').returns({
        sort: sinon.stub().resolves(fakeReminders),
      });

      await reminderController.getReminders(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(fakeReminders)).to.be.true;
    });
  });

  describe('Update Reminder', () => {
    it('should update a reminder by id', async () => {
      const req = {
        params: { id: '123' },
        body: { message: 'Updated Reminder', reminderDate: new Date() }
      };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(Reminder, 'findByIdAndUpdate').resolves({ _id: '123', message: 'Updated Reminder' });

      await reminderController.updateReminder(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Reminder updated' })).to.be.true;
    });
  });

  describe('Delete Reminder', () => {
    it('should delete a reminder by id', async () => {
      const req = { params: { id: '123' } };
      const res = { status: sinon.stub().returnsThis(), json: sinon.stub() };

      sinon.stub(Reminder, 'findByIdAndDelete').resolves({ _id: '123' });

      await reminderController.deleteReminder(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ message: 'Reminder deleted' })).to.be.true;
    });
  });
});
