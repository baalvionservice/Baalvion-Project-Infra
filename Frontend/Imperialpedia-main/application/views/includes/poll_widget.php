<?php
/**
 * Imperialpedia Live Community Poll Widget
 * Usage: $this->load->view('includes/poll_widget', ['poll_slug' => 'homepage-algo-impact']);
 */
$poll_slug = isset($poll_slug) ? htmlspecialchars($poll_slug) : 'homepage-algo-impact';
?>
<style>
/* =========================================
   IMPERIALPEDIA LIVE COMMUNITY POLL WIDGET
   ========================================= */
.imp-poll-widget {
   background: #0f172a;
   border: 1px solid #1e293b;
   border-radius: 12px;
   padding: 22px 20px 18px;
   position: relative;
   overflow: hidden;
}
.imp-poll-widget::before {
   content: '';
   position: absolute;
   top: 0; left: 0; right: 0;
   height: 3px;
   background: linear-gradient(90deg, #d00000, #ff6b35, #fbbf24);
}
.imp-poll-badge {
   display: inline-flex;
   align-items: center;
   gap: 5px;
   background: rgba(251,191,36,0.15);
   border: 1px solid rgba(251,191,36,0.4);
   color: #fbbf24;
   font-size: 0.65rem;
   font-weight: 800;
   letter-spacing: 1.2px;
   text-transform: uppercase;
   padding: 3px 10px;
   border-radius: 20px;
   margin-bottom: 12px;
}
.imp-poll-badge .dot {
   width: 6px; height: 6px;
   background: #ef4444;
   border-radius: 50%;
   animation: blink 1s step-start infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.imp-poll-question {
   font-family: 'Oswald', sans-serif;
   font-size: 1rem;
   font-weight: 700;
   color: #f1f5f9;
   line-height: 1.4;
   margin-bottom: 16px;
}
.imp-poll-option {
   width: 100%;
   text-align: left;
   background: transparent;
   border: 1px solid #334155;
   border-radius: 8px;
   color: #cbd5e1;
   font-size: 0.88rem;
   padding: 10px 14px;
   margin-bottom: 8px;
   cursor: pointer;
   transition: all 0.2s ease;
   position: relative;
   display: flex;
   align-items: center;
   gap: 8px;
}
.imp-poll-option:hover:not(:disabled) {
   border-color: #d00000;
   background: rgba(208,0,0,0.08);
   color: #f1f5f9;
}
/* Results bar — shown after voting */
.imp-poll-result {
   display: none;
   width: 100%;
   text-align: left;
   margin-bottom: 8px;
   border-radius: 8px;
   overflow: hidden;
   border: 1px solid #1e293b;
}
.imp-poll-result-inner {
   position: relative;
   padding: 9px 14px;
   background: #1e293b;
}
.imp-poll-bar {
   position: absolute;
   top: 0; left: 0; bottom: 0;
   background: linear-gradient(90deg, rgba(208,0,0,0.35), rgba(208,0,0,0.12));
   border-radius: 8px 0 0 8px;
   transition: width 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
   width: 0%;
}
.imp-poll-bar.winning {
   background: linear-gradient(90deg, rgba(16,185,129,0.4), rgba(16,185,129,0.15));
}
.imp-poll-result-label {
   position: relative;
   z-index: 1;
   color: #e2e8f0;
   font-size: 0.86rem;
   font-weight: 600;
   display: flex;
   justify-content: space-between;
   align-items: center;
}
.imp-poll-result-pct {
   font-family: 'Oswald', sans-serif;
   font-size: 0.95rem;
   color: #fbbf24;
}
.imp-poll-voted-badge {
   display: none;
   font-size: 0.72rem;
   color: #10b981;
   font-weight: 700;
   letter-spacing: 0.8px;
   text-transform: uppercase;
   margin-left: 6px;
}
.imp-poll-footer {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-top: 14px;
   border-top: 1px solid #1e293b;
   padding-top: 10px;
}
.imp-poll-total {
   font-size: 0.75rem;
   color: #64748b;
}
.imp-poll-total strong {
   color: #94a3b8;
}
.imp-poll-msg {
   font-size: 0.75rem;
   padding: 2px 8px;
   border-radius: 4px;
   display: none;
}
.imp-poll-msg.success { color: #10b981; }
.imp-poll-msg.error   { color: #f87171; }
</style>

<div class="imp-poll-widget" id="imp-poll-<?php echo $poll_slug; ?>">
   <div class="imp-poll-badge">
      <span class="dot"></span> Live Community Poll
   </div>
   <div class="imp-poll-question" id="poll-q-<?php echo $poll_slug; ?>">
      Loading poll…
   </div>

   <!-- Vote buttons (shown before voting) -->
   <div id="poll-options-<?php echo $poll_slug; ?>">
      <div class="text-center py-2"><div class="spinner-border spinner-border-sm text-warning" role="status"></div></div>
   </div>

   <!-- Results bars (shown after voting) -->
   <div id="poll-results-<?php echo $poll_slug; ?>" style="display:none;"></div>

   <div class="imp-poll-footer">
      <div class="imp-poll-total" id="poll-total-<?php echo $poll_slug; ?>"></div>
      <div class="imp-poll-msg" id="poll-msg-<?php echo $poll_slug; ?>"></div>
   </div>
</div>

<script>
(function(){
   var SLUG = '<?php echo $poll_slug; ?>';
   var BASE = '<?php echo base_url(); ?>';
   var CSRF_NAME = '<?php echo $this->security->get_csrf_token_name(); ?>';
   var CSRF_HASH = '<?php echo $this->security->get_csrf_hash(); ?>';

   function renderOptions(data) {
      var slug = data.poll_slug;
      document.getElementById('poll-q-' + slug).textContent = data.question;
      document.getElementById('poll-total-' + slug).innerHTML =
         '<strong>' + data.total_votes + '</strong> votes cast';

      if (data.has_voted || data.status === 'already_voted') {
         renderResults(data);
         return;
      }

      var html = '';
      data.options.forEach(function(opt) {
         html += '<button class="imp-poll-option" onclick="impVote(\'' + slug + '\',' + opt.option_id + ')">' +
                 opt.option_text + '</button>';
      });
      document.getElementById('poll-options-' + slug).innerHTML = html;
   }

   function renderResults(data) {
      var slug = data.poll_slug;
      document.getElementById('poll-options-' + slug).style.display = 'none';
      var resDiv = document.getElementById('poll-results-' + slug);
      resDiv.style.display = 'block';

      var maxVotes = Math.max.apply(null, data.options.map(function(o){ return o.votes; }));
      var html = '';
      data.options.forEach(function(opt) {
         var winning = opt.votes === maxVotes && maxVotes > 0 ? 'winning' : '';
         var chosen  = (data.voted_option && opt.option_id == data.voted_option) ? ' ✓ YOUR VOTE' : '';
         html += '<div class="imp-poll-result" style="display:block;">' +
                   '<div class="imp-poll-result-inner">' +
                      '<div class="imp-poll-bar ' + winning + '" style="width:' + opt.percent + '%"></div>' +
                      '<div class="imp-poll-result-label">' +
                         '<span>' + opt.option_text + '<span class="imp-poll-voted-badge" style="' + (chosen ? 'display:inline;' : '') + '">' + chosen + '</span></span>' +
                         '<span class="imp-poll-result-pct">' + opt.percent + '%</span>' +
                      '</div>' +
                   '</div>' +
                '</div>';
      });
      resDiv.innerHTML = html;

      var msg = document.getElementById('poll-msg-' + slug);
      if (data.status === 'voted') {
         msg.textContent = '✅ Vote counted!';
         msg.className = 'imp-poll-msg success';
         msg.style.display = 'inline-block';
      } else if (data.status === 'already_voted') {
         msg.textContent = 'You already voted.';
         msg.className = 'imp-poll-msg';
         msg.style.display = 'inline-block';
         msg.style.color = '#94a3b8';
      }
   }

   // Load initial state
   fetch(BASE + 'poll/results/' + SLUG)
      .then(function(r){ return r.json(); })
      .then(renderOptions)
      .catch(function(e){ console.warn('Poll load error', e); });

   // Global vote handler
   window.impVote = function(slug, optionId) {
      // Disable all buttons immediately
      var btns = document.querySelectorAll('#poll-options-' + slug + ' .imp-poll-option');
      btns.forEach(function(b){ b.disabled = true; b.style.opacity = 0.5; });

      var formData = new URLSearchParams();
      formData.append(CSRF_NAME, CSRF_HASH);
      formData.append('slug', slug);
      formData.append('option_id', optionId);

      fetch(BASE + 'poll/vote', {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: formData.toString()
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
         renderResults(data);
         document.getElementById('poll-total-' + slug).innerHTML =
            '<strong>' + data.total_votes + '</strong> votes cast';
      })
      .catch(function(e){
         var msg = document.getElementById('poll-msg-' + slug);
         msg.textContent = 'Network error. Please try again.';
         msg.className = 'imp-poll-msg error';
         msg.style.display = 'inline-block';
         btns.forEach(function(b){ b.disabled = false; b.style.opacity = 1; });
      });
   };
})();
</script>
