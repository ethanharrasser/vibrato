import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getValues } from '../../../utils/misc';
import { thunkLoadProducts } from '../../../redux/products';
import ProductCard from '../ProductCard';
import './ProductsPage.css';


function ProductsPage() {
    const dispatch = useDispatch();

    const user = useSelector(state => state.session.user);
    const products = useSelector(state => state.products.products);
    const productCount = useSelector(state => state.products.count);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        user
            ? dispatch(thunkLoadProducts({ excludeUser: user }))
            : dispatch(thunkLoadProducts());
        setIsLoaded(true);
    }, [user, dispatch]);

    return (
        <main>
            {isLoaded ? <>
                <div className='info'>
                    <h1>All Products</h1>
                    <p className='count'>{productCount} results</p>
                </div>
                <ul>
                    {getValues(products).map(product => (
                        <ProductCard product={product} key={product.id} />
                    ))}
                </ul>
            </> : <p className='loading'>Loading...</p>}
        </main>
    );
}

export default ProductsPage;
