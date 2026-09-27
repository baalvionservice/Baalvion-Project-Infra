<style>

    .term-start-til{

    padding-bottom: 0.5rem;

    margin: 3rem 1em;

    color: #111;

    font-family: SourceSansPro,sans-serif;

    -webkit-font-smoothing: antialiased;

    position: relative;

    font-size: 2.2em;

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

.terms-list li a{

    display: block;

    text-decoration: none;

    color: #111;

    line-height: 1.25;

    font-size: 1.25rem;

    margin-bottom: 1rem;

    font-family: SourceSansPro,sans-serif;

    -webkit-font-smoothing: antialiased;

}

</style>



<div class="container-fluid my-5">

    <h1 class="mt-4 mb-2 term-start-til ml-3">Terms Beginning With '<?php echo ucfirst($this->uri->segment(2));?>'</h1>

    <div class="row mt-4">

        <?php foreach($terms as $term_res){?>

        <div class="col-md-3 col-12">

            <ul class="terms-list">

                <li><a href="<?php echo base_url().'term/'.$this->uri->segment(2).'/'.str_replace(' ','-',$term_res['term_name']); ?>"><?php echo ucfirst($term_res['term_name']);?></a></li> 

            </ul>

        </div>

        <?php } ?>

        



    </div>

</div>