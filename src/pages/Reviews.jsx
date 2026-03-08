import { GetReviews } from "../components/Reviews";
import Header from "../components/header";

function Review(){
    return(
        <>
        <div className='min-h-screen bg-white'>
        {/* <Header/> */}
        <GetReviews/>
        </div>
        </>
    )
}
export default Review;