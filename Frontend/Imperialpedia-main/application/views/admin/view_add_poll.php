<div class="content-wrapper" style="min-height: 900px; background-color: #f8fafc; padding: 25px;">
  <!-- Header -->
  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px 25px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div>
      <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">Create Community Poll</h2>
      <p style="color: #64748b; margin: 0; font-size: 13px;">Publish an interactive voting poll to collect reader sentiment on key topics.</p>
    </div>
    <a href="<?php echo base_url('imp-admin/polls'); ?>" style="background: #f1f5f9; color: #334155; padding: 9px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cbd5e1;">
      <i class="fa fa-arrow-left"></i> Back to Polls List
    </a>
  </div>

  <div style="background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 850px;">
    <form action="<?php echo base_url('imp-admin/save_poll'); ?>" method="POST">
      <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Poll Question *</label>
        <input type="text" name="question" required placeholder="e.g. Will Federal Reserve rate cuts boost tech stocks in 2027?" style="width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 15px; outline: none; background: #f8fafc;">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Category / Domain *</label>
          <select name="category" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
            <option value="Market Trends">Market Trends</option>
            <option value="AI & Technology">AI & Technology</option>
            <option value="Personal Finance">Personal Finance</option>
            <option value="Crypto & Digital Assets">Crypto & Digital Assets</option>
            <option value="Real Estate">Real Estate</option>
          </select>
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 6px; font-size: 13px;">Status *</label>
          <select name="status" required style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
            <option value="active">Active (Visible & Open for Voting)</option>
            <option value="closed">Closed (Archived)</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 700; color: #1e293b; margin-bottom: 10px; font-size: 13px;">Voting Options (Minimum 2 required)</label>
        
        <div style="margin-bottom: 10px;">
          <input type="text" name="option_1" required placeholder="Option 1 (e.g. Yes, significant rally)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div style="margin-bottom: 10px;">
          <input type="text" name="option_2" required placeholder="Option 2 (e.g. Neutral / Priced in)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div style="margin-bottom: 10px;">
          <input type="text" name="option_3" placeholder="Option 3 (Optional e.g. No, market correction expected)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
        <div>
          <input type="text" name="option_4" placeholder="Option 4 (Optional)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc;">
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
        <a href="<?php echo base_url('imp-admin/polls'); ?>" style="background: #f1f5f9; color: #475569; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Cancel</a>
        <button type="submit" name="submit" value="1" style="background: #f59e0b; color: #ffffff; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
          <i class="fa fa-paper-plane" style="margin-right: 6px;"></i> Publish Live Poll
        </button>
      </div>
    </form>
  </div>
</div>
