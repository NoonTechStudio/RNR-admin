import { GetImages } from "../components/Memories";
import Header from "../components/header";

function Memories(){
    return(
        <>
        <div className='min-h-screen bg-white'>
        {/* <Header/> */}
        <GetImages/>
        </div>
        </>
    )
}
export default Memories;
