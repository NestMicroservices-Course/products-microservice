import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../common';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService){}

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto;
    const totalPages = await this.prisma.product.count({ where: {
      available: true
    }});
    const lastPage = Math.ceil( totalPages / limit );

    const products = await this.prisma.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        available: true
      }
    });

    return {
      data: products,
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
        available: true
      }
    });

    if(!product){
      throw new RpcException(
        new NotFoundException('Product with id ' + id + ' not found'));
      // throw new RpcException('Product with id ' + id + ' not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: _, ...data } = updateProductDto;

    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id: id },
      data: data,
    })

    return product;
  }

  async remove(id: number) {

    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id: id },
      data: {
        available: false
      }
    })

    return product;

    // return this.prisma.product.delete({
    //   where: { id: id }
    // })
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));
    
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    if(products.length !== ids.length){
      throw new RpcException(new NotFoundException(
        'Some products were not found'
      ));
    }

    return products;
  }
}
