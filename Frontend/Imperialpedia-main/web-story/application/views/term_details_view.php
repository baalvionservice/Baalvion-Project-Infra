<style>

    @font-face {

  font-family: "SourceSansPro";

  src: local("Source Sans Pro"),

       url("https://investopedia.com/static/1.20.0/font/SourceSansPro-regular.woff2") format("woff2"),

       url("https://investopedia.com/static/1.20.0/font/SourceSansPro-regular.woff") format("woff"),

       url("https://investopedia.com/static/1.20.0/font/SourceSansPro-regular.ttf") format("truetype");

  font-weight: 400;

  font-style: normal;

  font-display: swap

}

@font-face {

  font-family: "Cabin-semi-bold";

  font-weight: 600;

  src: local("Cabin SemiBold"),

       url('https://investopedia.com/static/1.94.0/font/cabin-semi-bold.woff2') format("woff2"),

       url('https://investopedia.com/static/1.94.0/font/cabin-semi-bold.woff') format("woff"),

       url('https://investopedia.com/static/1.94.0/font/cabin-semi-bold.ttf') format("truetype")

}



 .term-start-til{

    padding-bottom: 0.5rem;

    margin: 3rem .2em;

    color: #111;

    font-family: SourceSansPro,sans-serif;

    -webkit-font-smoothing: antialiased;

    position: relative;

    font-size: 3em;

    font-weight: bolder;

    }

    .term-start-til:after {

    content: '';

    position: absolute;

    width: 1.875rem;

    height: 0.3125rem;

    background-color: #2c40d0;

    bottom: 0;

    left: 0;

}

.auth-publish{

    font-size: .875rem;

    line-height: 2;

    display: block;

    font-family: SourceSansPro,sans-serif;

    color: #111;

}

.auth-publish strong{

    text-transform: uppercase;

    letter-spacing: .05rem;

    display: inline;

    line-height: 1;

    padding-bottom: 1px;

    color: #111;

    font-family: Cabin-semi-bold,sans-serif;

    text-decoration: none;

    border-bottom-style: dashed;

    border-bottom-width: 1px;

}

.defin_til{

    font-size: 1.625rem;

    font-family: Cabin-semi-bold,sans-serif;

    margin-bottom: 0.5rem;

    color: #111;

    font-size: 1.5rem;

    margin: 0;

    font-weight: 400;

    line-height: 1.2;

}

.defin_desc{

    font-size: 1.125rem;

    letter-spacing: .05px;

    margin-bottom: 1.75rem;

    margin-top: 0;

    font-family: SourceSansPro,sans-serif;

    -webkit-font-smoothing: antialiased;

    color: #111;

}

.related-terms{

    margin-bottom: 0.75rem;

    color: #191919;

    font-size: 1.625rem;

    font-weight: 400;

    line-height: 1.2;

    font-family: SourceSansPro,sans-serif;

}

.rel-terms a{

    font-size: 1.5rem;

    text-decoration: none;

    color: #2c40d0;

    -webkit-transition: color .25s;

    transition: color .25s;

    line-height: 1.2;

    font-weight: 400;

}

.rel-desc{

    margin-right: 3px;

    margin-bottom: 1.25rem;

    line-height: 1.4; 

    font-size: 1rem;

    font-family: SourceSansPro,sans-serif;

}

.read-mre{

    color: #2c40d0;

    text-decoration: underline;

    text-decoration-color: #2c40d0;

}

.rel-til{

    font-size: 1.5rem;

    text-decoration: none;

    color: #2c40d0;

    -webkit-transition: color .25s;

    transition: color .25s;

    line-height: 1.2;

}

.rel-til a{

    text-transform: uppercase;

    letter-spacing: .05rem;

    color: #2c40d0;

    font-family: Cabin-semi-bold,sans-serif;

    margin: 0;

    font-size: .875rem;

    padding-top: 0.125rem;

    letter-spacing: .05px;

}

.rel-sub-til a{

    font-size: 1.5rem;

    font-weight: 500;

    color: #111;

}

</style>

<?php foreach($term as $term_info){ ?> 
<div class="container-fluid my-5">  
    <div class="row"> 
        <div class="col-md-3"></div> 
        <div class="col-md-6 col-12"> 
           <h1 class="mt-4 mb-2 term-start-til ml-3"><?php echo ucfirst($term_info['term_name']);?></h1> 
           <span class="auth-publish">By <strong><?php echo strtoupper($term_info['posted_by']);?></strong> Updated <?php $compile = strtotime($term_info['updated_date']);echo $myformat1 = date('F d, Y', $compile); ?></span> 
           <span class="auth-publish">Reviewed by <strong><?php echo strtoupper($term_info['reviewed_by']);?></strong></span> 
           <!-- secction 2 definaation  --> 
           <?php echo  $term_info['term_desc'];?>  
           <!-- section 3  related term --> 
           <h3 class="related-terms mt-4 mb-0">Related Terms</h3> 
                <?php foreach($related_term as $rel_term){?> 
                <h4 class="rel-terms"><a href="<?php echo base_url().'term/'.str_replace(' ','-',$rel_term['term_name']); ?>"><?php echo ucfirst($rel_term['term_name']); ?></a></h4> 
                <p class="rel-desc mb-3"> 
                <?php   
                $str=$rel_term['term_desc'];

                $pos= strpos($str,"<p>");

                echo $final_res = substr($str,$pos, 220);  

                ?> 

                <a href="<?php echo base_url().'term/'.str_replace(' ','-',$rel_term['term_name']); ?>" class="read-mre">more</a></p>

                <?php } ?>

                

           



           <!-- section 4  related term -->

           <h3 class="related-terms mt-4 mb-0">Related Article</h3>

              <?php foreach($related_post as $rel_pst){ 

              ?> 

           <div class="row my-2">

               <div class="col-4">

                    <img class="img-fluid" src="<?php echo base_url().'uploads/post/'.$rel_pst['post_img'];?>" alt="<?php echo ucfirst($rel_pst['post_alt_title']);?>">

               </div>

               <div class="col-8">

                      <h5 class="text-uppercase rel-til"><a href="<?php echo base_url().str_replace(' ','-',$rel_pst['cat_name']).'/'.str_replace(' ','-',$rel_pst['sub_cat_name'])?>"><?php echo ucfirst($rel_pst['sub_cat_name'])?></a></h5>

                      <h6 class="rel-sub-til"><a rel=”nofollow” href="<?php echo base_url().str_replace(' ','-',$rel_pst['cat_name']).'/'.str_replace(' ','-',$rel_pst['sub_cat_name']).'#'.str_replace(' ','-',$rel_pst['post_title'])?>"><?php echo ucfirst($rel_pst['post_title'])?></a></h6>

               </div>

            </div>

            <?php } ?>



        </div>

        <div class="col-md-3"></div> 
    </div>

</div>

<?php } ?>