import * as cron from 'node-cron';
import { AutomationService } from '../services/AutomationService';

const automationService = new AutomationService();

export function startScheduledJobs() {
  // Process permanent absences at 8:00 AM
  cron.schedule('0 8 * * 1-5', async () => {
    console.log('Processing permanent absences...');
    await automationService.processPermanentAbsences();
  });

  // Send WhatsApp reminders at 9:30 AM (placeholder - would integrate with WhatsApp API)
  cron.schedule('30 9 * * 1-5', async () => {
    console.log('Sending WhatsApp reminders...');
    // TODO: Implement WhatsApp integration
  });

  // Process late arrivals between 10:00-10:30 AM
  cron.schedule('*/5 10 * * 1-5', async () => {
    console.log('Processing late arrivals...');
    await automationService.processLateArrivals();
  });

  // Process "yom lo ba li" at 10:30 AM
  cron.schedule('30 10 * * 1-5', async () => {
    console.log('Processing yom lo ba li...');
    await automationService.processYomLoBaLi();
  });

  // Process end of day at 4:00 PM
  cron.schedule('0 16 * * 1-5', async () => {
    console.log('Processing end of day...');
    await automationService.processEndOfDay();
  });

  // Process monthly checks daily at 5:00 PM
  cron.schedule('0 17 * * 1-5', async () => {
    console.log('Processing monthly checks...');
    await automationService.processMonthlyChecks();
  });

  console.log('Scheduled jobs started');
}